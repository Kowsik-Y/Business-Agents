"""
Configuration management for Business Agent Server.
Reads environment variables with fallback defaults.
Supports offline deterministic simulator mode for workshops.
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "AI Multi-Agent Business Automation Hub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

    # LLM Settings
    DEFAULT_LLM_PROVIDER: str = "simulator"
    DEFAULT_MODEL_NAME: str = "gpt-4o"
    TEMPERATURE: float = 0.2
    MAX_TOKENS: int = 2048

    # API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Agent Loop Controls
    MAX_LOOP_ITERATIONS: int = 8
    TOOL_TIMEOUT_SECONDS: int = 15

    # MCP Integration
    MCP_SERVER_URL: str = "http://localhost:8001"


settings = Settings()
