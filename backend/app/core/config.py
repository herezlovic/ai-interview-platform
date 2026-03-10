from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "AI Interview Intelligence Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com",
    ]
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 500
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    FRAME_SAMPLE_RATE: int = 5
    MIN_INTERVIEW_DURATION_SEC: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
