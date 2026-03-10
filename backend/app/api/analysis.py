from fastapi import APIRouter, HTTPException
from app.services.orchestrator import orchestrator
router = APIRouter()

@router.get("/{session_id}/status")
async def get_analysis_status(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {"session_id": session_id, "status": session.status, "has_report": session.report is not None, "error": session.error_message}
