from fastapi import APIRouter

from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.deepface_service import deepface_service
from app.services.llm_service import llm_service
from app.services.whisper_service import whisper_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    await whisper_service.initialize()
    await deepface_service.initialize()
    await llm_service.initialize()
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        whisper=whisper_service.status,
        deepface=deepface_service.status,
        llm=llm_service.status,
        demo_ready=True,
    )
