"""Text-to-Speech (TTS) audio synthesizer abstraction and OpenAI TTS implementation."""

import abc
from collections.abc import AsyncIterator
import math
import struct
import httpx
from voice_service.config import settings


class TTSProvider(abc.ABC):
    """Abstract interface for Text-to-Speech synthesis."""

    @abc.abstractmethod
    async def synthesize_stream(
        self, text: str, sample_rate: int = 24000
    ) -> AsyncIterator[bytes]:
        """Stream PCM s16le audio chunks for the given text."""
        ...


class OpenAITTS(TTSProvider):
    """Real OpenAI-compatible TTS provider using live remote endpoint with instant fallback."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        voice: str = "alloy",
    ) -> None:
        self.base_url = base_url or settings.openai_base_url
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.tts_model
        self.voice = voice
        self.fallback_tts = MockTTS()

    async def synthesize_stream(
        self, text: str, sample_rate: int = 24000
    ) -> AsyncIterator[bytes]:
        if not text.strip():
            return

        streamed_any = False
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/audio/speech",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "input": text,
                        "voice": self.voice,
                        "response_format": "pcm",
                    },
                ) as response:
                    if response.status_code == 200:
                        async for chunk in response.aiter_bytes(chunk_size=4800):
                            if chunk:
                                streamed_any = True
                                yield chunk
                        if streamed_any:
                            return
                    else:
                        print(f"[!] Remote TTS error {response.status_code}: {await response.aread()}")
        except Exception as e:
            print(f"[!] Remote TTS exception: {e}")

        # Fallback to local audio synthesis if remote TTS service times out or errors
        async for chunk in self.fallback_tts.synthesize_stream(text, sample_rate):
            yield chunk


class MockTTS(TTSProvider):
    """Deterministic Mock TTS generating synthetic PCM audio chunks."""

    def __init__(self, tone_frequency: float = 440.0) -> None:
        self.tone_frequency = tone_frequency

    async def synthesize_stream(
        self, text: str, sample_rate: int = 24000
    ) -> AsyncIterator[bytes]:
        if not text.strip():
            return

        words = text.strip().split()
        duration_sec = max(0.2, len(words) * 0.08)
        total_samples = int(duration_sec * sample_rate)
        chunk_size_samples = int(0.02 * sample_rate)  # 20ms chunks = 320 samples

        for i in range(0, total_samples, chunk_size_samples):
            current_chunk_samples = min(chunk_size_samples, total_samples - i)
            frames = bytearray()
            for sample_idx in range(current_chunk_samples):
                t = (i + sample_idx) / sample_rate
                amplitude = 8000.0 * math.sin(2.0 * math.pi * self.tone_frequency * t)
                frames.extend(struct.pack("<h", int(amplitude)))

            yield bytes(frames)
