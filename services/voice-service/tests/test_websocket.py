"""Integration tests for live WebSocket voice stream and barge-in handling."""

import json
import math
import struct
import pytest
from fastapi.testclient import TestClient
from voice_service.main import app
from voice_service.routes import websocket as ws_module
from voice_service.stt import MockSTT
from voice_service.tts import MockTTS


@pytest.fixture(autouse=True)
def setup_test_providers():
    """Ensure fast deterministic providers during unit tests."""
    ws_module.stt_provider = MockSTT()
    ws_module.tts_provider = MockTTS()
    yield


def generate_pcm_frame(amplitude: float, frequency: float = 440.0, num_samples: int = 320) -> bytes:
    """Generate 20ms of 16kHz PCM audio."""
    frames = bytearray()
    for i in range(num_samples):
        t = i / 16000.0
        val = int(amplitude * math.sin(2.0 * math.pi * frequency * t))
        frames.extend(struct.pack("<h", max(-32768, min(32767, val))))
    return bytes(frames)


def test_websocket_session_connection_and_ready() -> None:
    client = TestClient(app)
    with client.websocket_connect("/voice/v1/sessions/vsession_test1") as websocket:
        ready_data = websocket.receive_json()
        assert ready_data["type"] == "session.ready"
        assert ready_data["session_id"] == "vsession_test1"
        assert ready_data["sample_rate"] == 16000
        assert ready_data["encoding"] == "pcm_s16le"


def test_websocket_audio_speech_and_transcription() -> None:
    client = TestClient(app)
    with client.websocket_connect("/voice/v1/sessions/vsession_test2") as websocket:
        ready_data = websocket.receive_json()
        assert ready_data["type"] == "session.ready"

        speech_frame = generate_pcm_frame(amplitude=15000.0)
        silence_frame = generate_pcm_frame(amplitude=0.0)

        # 1. Send speech frames (15 frames = 300ms > 250ms min speech)
        for _ in range(15):
            websocket.send_bytes(speech_frame)

        # Receive speech_started
        msg = websocket.receive_json()
        assert msg["type"] == "input_audio.speech_started"

        # 2. Send silence frames to endpoint (35 frames = 700ms > 600ms endpoint silence)
        for _ in range(35):
            websocket.send_bytes(silence_frame)

        # Receive speech_stopped
        msg_stopped = websocket.receive_json()
        assert msg_stopped["type"] == "input_audio.speech_stopped"

        # Receive transcript.final
        msg_transcript = websocket.receive_json()
        assert msg_transcript["type"] == "transcript.final"
        assert "text" in msg_transcript
        assert msg_transcript["confidence"] > 0.0

        # Receive streamed AI text / audio messages
        received_types = []
        for _ in range(3):
            try:
                frame = websocket.receive()
                if "text" in frame:
                    data = json.loads(frame["text"])
                    received_types.append(data.get("type"))
                elif "bytes" in frame:
                    received_types.append("binary_audio")
            except Exception:
                break

        assert any(
            t in received_types
            for t in ["response.text.delta", "response.audio.started", "binary_audio"]
        )
