"""Configuration settings for ai-orchestrator service."""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Automatically load environment variables from .env file
load_dotenv()


class Settings(BaseModel):
    service_name: str = "ai-orchestrator"
    environment: str = Field(default_factory=lambda: os.getenv("NODE_ENV", "development"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8002")))
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))

    # External services
    integration_service_url: str = Field(
        default_factory=lambda: os.getenv("INTEGRATION_SERVICE_URL", "http://localhost:8003")
    )
    core_api_url: str = Field(
        default_factory=lambda: os.getenv("CORE_API_URL", "http://localhost:8000")
    )

    # LLM Settings (loaded strictly from environment)
    openai_base_url: str = Field(
        default_factory=lambda: os.getenv(
            "OPENAI_BASE_URL", "https://api.openai.com/v1"
        )
    )
    openai_api_key: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    openai_model: str = Field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", "gemini-2.5-flash")
    )
    mock_llm: bool = Field(
        default_factory=lambda: os.getenv("MOCK_LLM", "false").lower() in ("true", "1", "yes")
    )

    # Database / Checkpointer
    database_url: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "postgresql://csp_user:csp_dev_password@localhost:5433/csp_db"
        )
    )
    redis_url: str = Field(
        default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6380")
    )


settings = Settings()
