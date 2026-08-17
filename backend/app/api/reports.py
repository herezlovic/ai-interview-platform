from fastapi import APIRouter, HTTPException

from app.services.orchestrator import orchestrator

router = APIRouter()


@router.get("/{session_id}")
async def get_report(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.report:
        raise HTTPException(404, "Report not ready yet")
    return session.report
