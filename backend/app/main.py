import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import analysis, health, interviews, reports
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clarion — Interview Intelligence",
    description="Multimodal interview evaluation using speech, facial emotion, and LLM analysis",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

_origins = ["*"] if settings.ENVIRONMENT == "production" else settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

STATIC_DIR = Path(settings.STATIC_DIR)
if STATIC_DIR.exists():
    assets = STATIC_DIR / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            return {"detail": "Not Found"}
        candidate = STATIC_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")


@app.on_event("startup")
async def startup_event():
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.DATA_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("%s starting (%s)", settings.APP_NAME, settings.ENVIRONMENT)
