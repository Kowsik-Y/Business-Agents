"""Voice Activity Detection (VAD) and Endpointing module."""

import collections
import struct
from dataclasses import dataclass, field
from enum import StrEnum
import numpy as np


class VADEvent(StrEnum):
    """VAD State events."""

    NONE = "none"
    SPEECH_STARTED = "speech_started"
    SPEECH_CONTINUED = "speech_continued"
    SPEECH_STOPPED = "speech_stopped"


@dataclass
class VADState:
    """Internal state for VAD processing."""

    is_speaking: bool = False
    speech_duration_ms: float = 0.0
    silence_duration_ms: float = 0.0
    pre_speech_frames: collections.deque[bytes] = field(default_factory=collections.deque)
    accumulated_speech_audio: bytearray = field(default_factory=bytearray)


class EnergyVAD:
    """Energy/RMS-based Voice Activity Detector with endpointing and barge-in hardening."""

    def __init__(
        self,
        energy_threshold: float = 0.02,
        min_speech_duration_ms: int = 250,
        end_of_speech_silence_ms: int = 600,
        max_utterance_duration_ms: int = 30000,
        pre_speech_buffer_ms: int = 200,
        sample_rate: int = 16000,
        frame_duration_ms: int = 20,
        barge_in_energy_threshold: float = 0.06,
        barge_in_min_speech_ms: int = 400,
    ) -> None:
        # Normal listening thresholds
        self._normal_energy_threshold = energy_threshold
        self._normal_min_speech_ms = min_speech_duration_ms
        # Hardened barge-in thresholds (suppress ambient noise during TTS playback)
        self._barge_in_energy_threshold = barge_in_energy_threshold
        self._barge_in_min_speech_ms = barge_in_min_speech_ms

        self.energy_threshold = energy_threshold
        self.min_speech_duration_ms = min_speech_duration_ms
        self.end_of_speech_silence_ms = end_of_speech_silence_ms
        self.max_utterance_duration_ms = max_utterance_duration_ms
        self.frame_duration_ms = frame_duration_ms
        self.sample_rate = sample_rate
        self._barge_in_mode = False

        max_pre_frames = max(1, int(pre_speech_buffer_ms / frame_duration_ms))
        self.state = VADState(pre_speech_frames=collections.deque(maxlen=max_pre_frames))

    def set_barge_in_mode(self, enabled: bool) -> None:
        """Switch between normal and barge-in hardened VAD thresholds.

        When enabled (during TTS playback), uses higher energy threshold and
        longer minimum speech duration to reject ambient noise, keyboard clicks,
        and acoustic echo while still detecting genuine spoken interruptions.
        """
        self._barge_in_mode = enabled
        if enabled:
            self.energy_threshold = self._barge_in_energy_threshold
            self.min_speech_duration_ms = self._barge_in_min_speech_ms
        else:
            self.energy_threshold = self._normal_energy_threshold
            self.min_speech_duration_ms = self._normal_min_speech_ms
        # Reset accumulated speech duration so partial ambient triggers don't carry over
        self.state.speech_duration_ms = 0.0

    def calculate_energy(self, pcm_frame: bytes) -> float:
        """Calculate RMS energy of 16-bit PCM frame."""
        if not pcm_frame:
            return 0.0
        num_samples = len(pcm_frame) // 2
        if num_samples == 0:
            return 0.0

        try:
            # Unpack 16-bit signed integers
            samples = np.frombuffer(pcm_frame, dtype=np.int16).astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(samples**2))
            return float(rms)
        except Exception:
            return 0.0

    def process_frame(self, pcm_frame: bytes) -> tuple[VADEvent, bytes | None]:
        """Process a single 20ms audio frame and return (event, speech_audio_if_stopped)."""
        energy = self.calculate_energy(pcm_frame)
        is_active = energy >= self.energy_threshold

        if not self.state.is_speaking:
            # Currently in silence / listening state
            self.state.pre_speech_frames.append(pcm_frame)

            if is_active:
                self.state.speech_duration_ms += self.frame_duration_ms
                if self.state.speech_duration_ms >= self.min_speech_duration_ms:
                    # Speech onset confirmed
                    self.state.is_speaking = True
                    self.state.silence_duration_ms = 0.0

                    # Prepend pre-speech buffer
                    self.state.accumulated_speech_audio.clear()
                    for pre_frame in self.state.pre_speech_frames:
                        self.state.accumulated_speech_audio.extend(pre_frame)

                    return VADEvent.SPEECH_STARTED, None
            else:
                self.state.speech_duration_ms = max(
                    0.0, self.state.speech_duration_ms - self.frame_duration_ms
                )

            return VADEvent.NONE, None

        else:
            # Currently in active speech
            self.state.accumulated_speech_audio.extend(pcm_frame)
            self.state.speech_duration_ms += self.frame_duration_ms

            if not is_active:
                self.state.silence_duration_ms += self.frame_duration_ms
                if self.state.silence_duration_ms >= self.end_of_speech_silence_ms:
                    # Endpoint reached: end of speech detected
                    utterance = bytes(self.state.accumulated_speech_audio)
                    self.reset()
                    return VADEvent.SPEECH_STOPPED, utterance
            else:
                self.state.silence_duration_ms = 0.0

            # Check for max utterance cap
            if self.state.speech_duration_ms >= self.max_utterance_duration_ms:
                utterance = bytes(self.state.accumulated_speech_audio)
                self.reset()
                return VADEvent.SPEECH_STOPPED, utterance

            return VADEvent.SPEECH_CONTINUED, None

    def reset(self) -> None:
        """Reset VAD internal state."""
        self.state.is_speaking = False
        self.state.speech_duration_ms = 0.0
        self.state.silence_duration_ms = 0.0
        self.state.accumulated_speech_audio.clear()
        self.state.pre_speech_frames.clear()
