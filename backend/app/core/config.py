from __future__ import annotations

import json
import os
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_origins(value: str | list[str] | None) -> List[str]:
    defaults = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    if value is None or value == "":
        return defaults
    if isinstance(value, list):
        return value
    raw = value.strip()
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except json.JSONDecodeError:
            pass
    return [part.strip() for part in raw.split(",") if part.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    APP_NAME: str = "Clarion"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    DATA_DIR: str = os.getenv("DATA_DIR", "data")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_PROVIDER: str = os.getenv("WHISPER_PROVIDER", "auto")  # auto | local | openai | mock
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    FRAME_SAMPLE_RATE: int = int(os.getenv("FRAME_SAMPLE_RATE", "5"))
    MIN_INTERVIEW_DURATION_SEC: int = 30
    STATIC_DIR: str = os.getenv("STATIC_DIR", "static")
    ALLOWED_ORIGINS: List[str] = _parse_origins(os.getenv("ALLOWED_ORIGINS"))


settings = Settings()
