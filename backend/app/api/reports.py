from fastapi import APIRouter, HTTPException
from app.services.orchestrator import orchestrator
from app.models.schemas import CandidateReport, InterviewStatus
router = APIRouter()

@router.get("/{session_id}", response_model=CandidateReport)
async def get_report(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != InterviewStatus.COMPLETED:
        raise HTTPException(400, f"Report not ready. Status: {session.status}")
    if not session.report:
        raise HTTPException(404, "Report not available")
    return session.report
