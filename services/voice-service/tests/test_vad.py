"""Tests for Voice Activity Detection and endpointing."""

import math
import struct
import pytest
from voice_service.vad import EnergyVAD, VADEvent


def generate_pcm_frame(amplitude: float, frequency: float = 440.0, num_samples: int = 320) -> bytes:
    """Generate 20ms of 16kHz PCM audio at a specific amplitude."""
    frames = bytearray()
    for i in range(num_samples):
        t = i / 16000.0
        val = int(amplitude * math.sin(2.0 * math.pi * frequency * t))
        frames.extend(struct.pack("<h", max(-32768, min(32767, val))))
    return bytes(frames)


def test_energy_calculation_silence() -> None:
    vad = EnergyVAD()
    silence = b"\x00" * 640
    energy = vad.calculate_energy(silence)
    assert energy == 0.0


def test_energy_calculation_tone() -> None:
    vad = EnergyVAD()
    tone = generate_pcm_frame(amplitude=16000.0)  # ~0.49 normalized RMS
    energy = vad.calculate_energy(tone)
    assert energy > 0.3


def test_vad_speech_start_and_endpointing() -> None:
    vad = EnergyVAD(
        min_speech_duration_ms=100,
        end_of_speech_silence_ms=200,
        frame_duration_ms=20,
    )

    silence_frame = generate_pcm_frame(amplitude=0.0)
    speech_frame = generate_pcm_frame(amplitude=15000.0)

    # 1. Initial silence
    event, _ = vad.process_frame(silence_frame)
    assert event == VADEvent.NONE
    assert not vad.state.is_speaking

    # 2. Feed speech frames (5 frames = 100ms)
    events = []
    for _ in range(5):
        evt, _ = vad.process_frame(speech_frame)
        events.append(evt)

    assert VADEvent.SPEECH_STARTED in events
    assert vad.state.is_speaking

    # 3. Feed more speech frames
    evt, _ = vad.process_frame(speech_frame)
    assert evt == VADEvent.SPEECH_CONTINUED

    # 4. Feed silence frames to trigger endpoint (10 frames = 200ms)
    stopped_evt = None
    accumulated_audio = None
    for _ in range(11):
        evt, audio = vad.process_frame(silence_frame)
        if evt == VADEvent.SPEECH_STOPPED:
            stopped_evt = evt
            accumulated_audio = audio
            break

    assert stopped_evt == VADEvent.SPEECH_STOPPED
    assert accumulated_audio is not None
    assert len(accumulated_audio) > 0
    assert not vad.state.is_speaking
