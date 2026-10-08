"""Voice Service configuration."""

import os
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Automatically load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Voice service runtime settings."""

    model_config = SettingsConfigDict(env_prefix="VOICE_", env_file=".env", extra="ignore")

    app_name: str = "voice-service"
    app_version: str = "0.1.0"
    port: int = 8004
    environment: str = "development"

    # Audio Specifications
    sample_rate: int = 16000
    channels: int = 1
    sample_width: int = 2  # 16-bit PCM = 2 bytes
    frame_duration_ms: int = 20  # 20ms frame = 320 samples = 640 bytes

    # VAD & Endpointing Defaults
    energy_threshold: float = 0.02
    min_speech_duration_ms: int = 250
    end_of_speech_silence_ms: int = 600
    max_utterance_duration_ms: int = 30000
    pre_speech_buffer_ms: int = 200

    # Barge-In Hardened Thresholds (used only during TTS playback to reject ambient noise)
    barge_in_energy_threshold: float = 0.06
    barge_in_min_speech_ms: int = 400

    # OpenAI & LLM/TTS/STT Integration (loaded securely from environment)
    openai_base_url: str = Field(
        default_factory=lambda: os.getenv("OPENAI_BASE_URL", os.getenv("VOICE_OPENAI_BASE_URL", "https://api.openai.com/v1")),
        description="OpenAI compatible API base URL",
    )
    openai_api_key: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", os.getenv("VOICE_OPENAI_API_KEY", "")),
        description="OpenAI API Key",
    )
    llm_model: str = Field(
        default="gemini-2.5-flash",
        description="LLM model (e.g., gemini-2.5-flash, gpt-4.1-nano, nova-micro)",
    )
    tts_model: str = Field(
        default="gpt-4o-mini-tts",
        description="TTS model (e.g., gpt-4o-mini-tts, gemini-2.5-flash-tts)",
    )
    stt_model_size: str = Field(
        default="tiny",
        description="Faster Whisper model size (e.g., tiny, base, small)",
    )

    # AI Orchestrator & Services
    ai_orchestrator_url: str = Field(
        default="http://localhost:8002",
        description="URL for AI Orchestrator service",
    )
    core_api_url: str = Field(
        default="http://localhost:8000",
        description="URL for Core API service",
    )


settings = Settings()
