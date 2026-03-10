"""
Interview Analysis Orchestrator
Coordinates Whisper, DeepFace, and LLM services to produce a complete candidate report
"""

import asyncio
import logging
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from app.core.config import settings
from app.models.schemas import (
    CandidateReport,
    InterviewSession,
    InterviewStatus,
    ProcessingUpdate,
)
from app.services.deepface_service import deepface_service
from app.services.llm_service import llm_service
from app.services.whisper_service import whisper_service

logger = logging.getLogger(__name__)

# In-memory session store (replace with DB in production)
sessions: Dict[str, InterviewSession] = {}
# Progress callbacks
progress_callbacks: Dict[str, list] = {}


class AnalysisOrchestrator:
    """
    Orchestrates the full interview analysis pipeline:
    1. Speech-to-text (Whisper)
    2. Facial emotion analysis (DeepFace)
    3. Communication metrics analysis (rule-based)
    4. LLM behavioral analysis
    5. Report generation
    """

    async def create_session(
        self,
        candidate_name: Optional[str] = None,
        position: Optional[str] = None,
        interviewer: Optional[str] = None,
    ) -> InterviewSession:
        session = InterviewSession(
            id=str(uuid.uuid4()),
            candidate_name=candidate_name,
            position=position,
            interviewer=interviewer,
            status=InterviewStatus.PENDING,
        )
        sessions[session.id] = session
        logger.info(f"Created interview session: {session.id}")
        return session

    async def process_video(
        self,
        session_id: str,
        video_path: str,
        job_description: Optional[str] = None,
    ) -> CandidateReport:
        """Run the full analysis pipeline on an interview video"""
        session = sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.status = InterviewStatus.PROCESSING
        session.video_path = video_path
        session.updated_at = datetime.utcnow()

        start_time = time.time()

        try:
            # Stage 1: Speech-to-text
            await self._emit_progress(session_id, "transcription", 10, "Extracting and transcribing speech...")
            audio_path = await whisper_service.extract_audio(video_path)
            transcript = await whisper_service.transcribe(audio_path)
            await self._emit_progress(session_id, "transcription", 30, f"Transcribed {transcript.word_count} words")

            # Stage 2: Facial emotion detection
            await self._emit_progress(session_id, "emotion_analysis", 35, "Analyzing facial expressions...")
            emotion_timeline = await deepface_service.analyze_video(video_path)
            emotional_profile = deepface_service.build_emotional_profile(emotion_timeline)
            await self._emit_progress(session_id, "emotion_analysis", 55, f"Analyzed {len(emotion_timeline)} video frames")

            # Stage 3: Communication metrics
            await self._emit_progress(session_id, "communication_analysis", 58, "Computing communication metrics...")
            communication_metrics = llm_service.analyze_communication_metrics(transcript)
            behavioral_signals = llm_service.analyze_behavioral_signals(emotional_profile)
            await self._emit_progress(session_id, "communication_analysis", 65, "Communication analysis complete")

            # Stage 4: LLM analysis
            await self._emit_progress(session_id, "llm_analysis", 68, "Running AI behavioral analysis...")
            llm_analysis = await llm_service.generate_llm_analysis(
                transcript=transcript,
                communication=communication_metrics,
                emotional=emotional_profile,
                behavioral=behavioral_signals,
                position=session.position,
                job_description=job_description,
            )
            await self._emit_progress(session_id, "llm_analysis", 88, "Behavioral analysis complete")

            # Stage 5: Compute overall scores
            await self._emit_progress(session_id, "report_generation", 90, "Generating evaluation report...")

            overall_score = self._compute_overall_score(
                communication_metrics, emotional_profile, behavioral_signals
            )
            communication_score = (
                communication_metrics.clarity_score +
                communication_metrics.confidence_score +
                communication_metrics.coherence_score
            ) / 3
            emotional_intelligence_score = (
                emotional_profile.emotional_stability_score +
                emotional_profile.engagement_score
            ) / 2

            processing_time = time.time() - start_time

            report = CandidateReport(
                interview_id=session_id,
                candidate_name=session.candidate_name,
                position=session.position,
                overall_score=round(overall_score, 1),
                communication_score=round(communication_score, 1),
                emotional_intelligence_score=round(emotional_intelligence_score, 1),
                transcript=transcript,
                communication_metrics=communication_metrics,
                emotional_profile=emotional_profile,
                behavioral_signals=behavioral_signals,
                llm_analysis=llm_analysis,
                video_duration=transcript.duration,
                processing_time=round(processing_time, 2),
            )

            session.status = InterviewStatus.COMPLETED
            session.report = report
            session.updated_at = datetime.utcnow()

            await self._emit_progress(session_id, "complete", 100, "Analysis complete!")
            logger.info(f"Analysis complete for session {session_id} in {processing_time:.1f}s")
            return report

        except Exception as e:
            session.status = InterviewStatus.FAILED
            session.error_message = str(e)
            session.updated_at = datetime.utcnow()
            await self._emit_progress(session_id, "error", 0, f"Analysis failed: {str(e)}")
            logger.error(f"Analysis failed for session {session_id}: {e}", exc_info=True)
            raise

    def _compute_overall_score(self, communication, emotional, behavioral) -> float:
        weights = {
            "clarity": (communication.clarity_score, 0.15),
            "confidence": (communication.confidence_score, 0.15),
            "coherence": (communication.coherence_score, 0.10),
            "vocabulary": (communication.vocabulary_richness, 0.05),
            "stability": (emotional.emotional_stability_score, 0.15),
            "engagement": (emotional.engagement_score, 0.15),
            "eye_contact": (behavioral.eye_contact_score, 0.10),
            "attentiveness": (behavioral.attentiveness_score, 0.10),
            "authenticity": (behavioral.authenticity_score, 0.05),
        }
        return sum(score * weight for score, weight in weights.values())

    async def _emit_progress(self, session_id: str, stage: str, progress: float, message: str):
        """Emit progress update to any registered callbacks"""
        update = ProcessingUpdate(
            interview_id=session_id,
            stage=stage,
            progress=progress,
            message=message,
        )
        callbacks = progress_callbacks.get(session_id, [])
        for callback in callbacks:
            try:
                await callback(update)
            except Exception:
                pass

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        return sessions.get(session_id)

    def list_sessions(self) -> list:
        return sorted(sessions.values(), key=lambda s: s.created_at, reverse=True)

    def register_progress_callback(self, session_id: str, callback):
        if session_id not in progress_callbacks:
            progress_callbacks[session_id] = []
        progress_callbacks[session_id].append(callback)


orchestrator = AnalysisOrchestrator()
