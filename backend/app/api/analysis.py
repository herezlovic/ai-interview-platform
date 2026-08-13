from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalysisStatusResponse
from app.services.orchestrator import orchestrator

router = APIRouter()


@router.get("/{session_id}/status", response_model=AnalysisStatusResponse)
async def get_analysis_status(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return AnalysisStatusResponse(
        session_id=session_id,
        status=session.status,
        stage=session.stage,
        progress=session.progress,
        message=session.message,
        has_report=session.report is not None,
        error=session.error_message,
    )
