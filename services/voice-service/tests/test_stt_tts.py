"""Tests for STT transcription and TTS audio synthesis."""

import pytest
from voice_service.stt import MockSTT
from voice_service.tts import MockTTS


@pytest.mark.asyncio
async def test_mock_stt_transcription() -> None:
    stt = MockSTT(default_text="Where is my order ORD-1001?")
    
    # Empty audio returns empty text
    res_empty = await stt.transcribe(b"")
    assert res_empty.text == ""

    # Audio bytes return default transcript
    fake_audio = b"\x00" * 3200
    res = await stt.transcribe(fake_audio)
    assert res.text == "Where is my order ORD-1001?"
    assert res.confidence >= 0.90


@pytest.mark.asyncio
async def test_mock_tts_stream() -> None:
    tts = MockTTS()
    text = "Hello! Your package has shipped via FedEx."
    
    chunks = []
    async for chunk in tts.synthesize_stream(text, sample_rate=16000):
        chunks.append(chunk)

    assert len(chunks) > 0
    # Each 20ms chunk at 16kHz s16le is 640 bytes (320 samples * 2 bytes)
    for chunk in chunks:
        assert len(chunk) <= 640
        assert len(chunk) % 2 == 0
