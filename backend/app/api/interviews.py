from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.models.schemas import InterviewSession, InterviewStatus
from app.services.orchestrator import orchestrator
from app.services.store import store

router = APIRouter()
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXT = {".mp4", ".webm", ".mov", ".avi", ".mkv"}


@router.post("/", response_model=InterviewSession)
async def create_interview(
    background_tasks: BackgroundTasks,
    candidate_name: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    interviewer: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
):
    session = await orchestrator.create_session(
        candidate_name=candidate_name,
        position=position,
        interviewer=interviewer,
        job_description=job_description,
        is_demo=False,
    )
    if video and video.filename:
        content_type = (video.content_type or "").lower()
        ext = Path(video.filename).suffix.lower()
        if not (content_type.startswith("video/") or ext in ALLOWED_EXT):
            raise HTTPException(400, "Uploaded file must be a video")
        if ext not in ALLOWED_EXT:
            ext = ".mp4"
        video_path = UPLOAD_DIR / f"{session.id}{ext}"
        content = await video.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(413, f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB")
        video_path.write_bytes(content)
        background_tasks.add_task(
            orchestrator.process_video,
            session_id=session.id,
            video_path=str(video_path),
            job_description=job_description,
        )
    return session


@router.get("/", response_model=List[InterviewSession])
async def list_interviews():
    return orchestrator.list_sessions()


@router.get("/{session_id}", response_model=InterviewSession)
async def get_interview(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, f"Interview session {session_id} not found")
    return session


@router.delete("/{session_id}")
async def delete_interview(session_id: str):
    if not orchestrator.delete_session(session_id):
        raise HTTPException(404, f"Interview session {session_id} not found")
    return {"deleted": True, "session_id": session_id}


@router.post("/{session_id}/demo")
async def run_demo_analysis(
    session_id: str,
    background_tasks: BackgroundTasks,
    position: Optional[str] = None,
):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, f"Session {session_id} not found")
    if session.status == InterviewStatus.PROCESSING:
        raise HTTPException(400, "Session is already being processed")
    if position:
        session.position = position
    session.is_demo = True
    store.save(session)
    background_tasks.add_task(
        orchestrator.process_video,
        session_id=session_id,
        video_path="demo://mock",
        job_description=session.job_description,
    )
    return {"message": "Demo analysis started", "session_id": session_id}
