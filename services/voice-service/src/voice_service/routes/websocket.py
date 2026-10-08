"""WebSocket voice session handler with live VAD, STT, AI streaming, TTS, text integration, and barge-in."""

import asyncio
import json
import uuid
from typing import Annotated
from fastapi import APIRouter, Path, WebSocket, WebSocketDisconnect
from voice_service.config import settings
from voice_service.orchestrator_client import OrchestratorClient
from voice_service.session import VoiceSessionState, registry
from voice_service.stt import FasterWhisperSTT, STTProvider
from voice_service.tts import OpenAITTS, TTSProvider
from voice_service.vad import EnergyVAD, VADEvent

router = APIRouter(tags=["Voice WebSocket"])

# Live OpenAI & FasterWhisper providers
stt_provider: STTProvider = FasterWhisperSTT(model_size=settings.stt_model_size)
tts_provider: TTSProvider = OpenAITTS(
    base_url=settings.openai_base_url,
    api_key=settings.openai_api_key,
    model=settings.tts_model,
)
orchestrator_client = OrchestratorClient()


@router.websocket("/voice/v1/sessions/{session_id}")
async def voice_websocket_endpoint(
    websocket: WebSocket,
    session_id: Annotated[str, Path(description="Voice Session ID")],
) -> None:
    """Live bidirectional voice streaming WebSocket."""
    await websocket.accept()

    session = registry.get(session_id)
    if not session:
        # Create on-the-fly session for direct connection
        session = registry.create(
            session_id=session_id,
            conversation_id=f"conv_voice_{session_id[:8]}",
            customer_id="cust-voice-user",
            token=f"vtoken_{uuid.uuid4().hex[:12]}",
            ws_url=f"ws://localhost:{settings.port}/voice/v1/sessions/{session_id}",
        )

    vad = EnergyVAD(
        energy_threshold=settings.energy_threshold,
        min_speech_duration_ms=settings.min_speech_duration_ms,
        end_of_speech_silence_ms=settings.end_of_speech_silence_ms,
        max_utterance_duration_ms=settings.max_utterance_duration_ms,
        pre_speech_buffer_ms=settings.pre_speech_buffer_ms,
        sample_rate=settings.sample_rate,
        frame_duration_ms=settings.frame_duration_ms,
        barge_in_energy_threshold=settings.barge_in_energy_threshold,
        barge_in_min_speech_ms=settings.barge_in_min_speech_ms,
    )

    session.transition_to(VoiceSessionState.LISTENING)

    # Send session.ready event
    await websocket.send_text(
        json.dumps(
            {
                "type": "session.ready",
                "session_id": session_id,
                "conversation_id": session.model.conversation_id,
                "sample_rate": settings.sample_rate,
                "encoding": "pcm_s16le",
            }
        )
    )

    current_ai_task: asyncio.Task[None] | None = None

    async def run_ai_turn_and_tts(user_transcript: str) -> None:
        """Background task to fetch AI response and stream synthesized audio."""
        response_id = f"resp_{uuid.uuid4().hex[:8]}"
        session.start_response(response_id)
        session.transition_to(VoiceSessionState.THINKING)

        try:
            full_text = ""
            async for text_delta in orchestrator_client.stream_turn(
                conversation_id=session.model.conversation_id,
                customer_id=session.model.customer_id,
                message=user_transcript,
            ):
                if session.is_cancelled:
                    return

                full_text += text_delta
                # Emit text delta
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "response.text.delta",
                            "response_id": response_id,
                            "content": text_delta,
                        }
                    )
                )

            if session.is_cancelled or not full_text.strip():
                return

            # Begin TTS playback — activate barge-in hardened VAD thresholds
            session.transition_to(VoiceSessionState.SPEAKING)
            vad.set_barge_in_mode(True)
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "response.audio.started",
                        "response_id": response_id,
                        "text": full_text,
                    }
                )
            )

            async for audio_chunk in tts_provider.synthesize_stream(
                full_text, sample_rate=24000
            ):
                if session.is_cancelled:
                    return
                # Send binary PCM audio frame to browser
                await websocket.send_bytes(audio_chunk)
                await asyncio.sleep(0.001)  # Minimal yield without slowing audio stream

            if not session.is_cancelled:
                vad.set_barge_in_mode(False)
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "response.completed",
                            "response_id": response_id,
                        }
                    )
                )
                session.transition_to(VoiceSessionState.LISTENING)

        except Exception as e:
            if not session.is_cancelled:
                vad.set_barge_in_mode(False)
                await websocket.send_text(
                    json.dumps({"type": "error", "message": str(e)})
                )
                session.transition_to(VoiceSessionState.LISTENING)

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            # Handle JSON text frames
            if "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    event_type = payload.get("type")

                    if event_type in ("input.text", "client_speech_recognition"):
                        input_text = payload.get("text", "").strip()
                        if input_text:
                            if current_ai_task and not current_ai_task.done():
                                current_ai_task.cancel()
                                session.cancel_current_response()
                                await websocket.send_text(
                                    json.dumps({"type": "response.cancelled", "reason": "barge_in"})
                                )
                            session.transition_to(VoiceSessionState.TRANSCRIBING)
                            await websocket.send_text(
                                json.dumps(
                                    {
                                        "type": "transcript.final",
                                        "text": input_text,
                                        "confidence": 1.0,
                                        "language": "en",
                                    }
                                )
                            )
                            current_ai_task = asyncio.create_task(run_ai_turn_and_tts(input_text))

                    elif event_type == "response.cancel":
                        # Explicit cancellation
                        session.cancel_current_response()
                        if current_ai_task and not current_ai_task.done():
                            current_ai_task.cancel()
                        vad.reset()
                        vad.set_barge_in_mode(False)
                        session.transition_to(VoiceSessionState.LISTENING)

                    elif event_type == "session.stop":
                        session.transition_to(VoiceSessionState.CLOSED)
                        break

                except json.JSONDecodeError:
                    pass

            # Handle Binary PCM Audio frames
            elif "bytes" in message and message["bytes"]:
                pcm_frame = message["bytes"]

                # Process VAD
                event, speech_audio = vad.process_frame(pcm_frame)

                # Check Barge-in: user started speaking while assistant was speaking/thinking
                if session.state in (VoiceSessionState.SPEAKING, VoiceSessionState.THINKING):
                    if event == VADEvent.SPEECH_STARTED:
                        session.cancel_current_response()
                        vad.set_barge_in_mode(False)
                        if current_ai_task and not current_ai_task.done():
                            current_ai_task.cancel()
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "response.cancelled",
                                    "reason": "barge_in",
                                }
                            )
                        )
                        session.transition_to(VoiceSessionState.SPEECH_DETECTED)
                        await websocket.send_text(
                            json.dumps({"type": "input_audio.speech_started"})
                        )

                elif event == VADEvent.SPEECH_STARTED:
                    session.transition_to(VoiceSessionState.SPEECH_DETECTED)
                    await websocket.send_text(
                        json.dumps({"type": "input_audio.speech_started"})
                    )

                elif event == VADEvent.SPEECH_STOPPED and speech_audio:
                    session.transition_to(VoiceSessionState.TRANSCRIBING)
                    await websocket.send_text(
                        json.dumps({"type": "input_audio.speech_stopped"})
                    )

                    # Transcribe utterance
                    result = await stt_provider.transcribe(speech_audio)
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "transcript.final",
                                "text": result.text,
                                "confidence": result.confidence,
                                "language": result.language,
                            }
                        )
                    )

                    if result.text.strip():
                        # Start AI turn and TTS synthesis
                        if current_ai_task and not current_ai_task.done():
                            current_ai_task.cancel()
                        current_ai_task = asyncio.create_task(
                            run_ai_turn_and_tts(result.text)
                        )
                    else:
                        session.transition_to(VoiceSessionState.LISTENING)

    except WebSocketDisconnect:
        pass
    finally:
        session.cancel_current_response()
        if current_ai_task and not current_ai_task.done():
            current_ai_task.cancel()
        session.transition_to(VoiceSessionState.CLOSED)
        registry.remove(session_id)
