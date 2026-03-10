from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import interviews, analysis, reports, health
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Interview Intelligence Platform",
    description="Multimodal interview evaluation using speech, facial emotion, and LLM analysis",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.on_event("startup")
async def startup_event():
    logger.info("AI Interview Intelligence Platform starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
