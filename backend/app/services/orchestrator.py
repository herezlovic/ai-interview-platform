"""Coordinates Whisper, DeepFace, and LLM into a candidate report."""

from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime
from typing import Optional

from app.models.schemas import CandidateReport, InterviewSession, InterviewStatus
from app.services.deepface_service import deepface_service
from app.services.llm_service import llm_service
from app.services.store import store
from app.services.whisper_service import whisper_service

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    async def create_session(
        self,
        candidate_name: Optional[str] = None,
        position: Optional[str] = None,
        interviewer: Optional[str] = None,
        job_description: Optional[str] = None,
        is_demo: bool = False,
    ) -> InterviewSession:
        session = InterviewSession(
            id=str(uuid.uuid4()),
            candidate_name=candidate_name,
            position=position,
            interviewer=interviewer,
            job_description=job_description,
            status=InterviewStatus.PENDING,
            is_demo=is_demo,
            stage="queued",
            progress=0,
            message="Waiting to start",
        )
        return store.save(session)

    async def process_video(
        self,
        session_id: str,
        video_path: str,
        job_description: Optional[str] = None,
    ) -> CandidateReport:
        session = store.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        is_demo = session.is_demo or video_path.startswith("demo://")
        session.status = InterviewStatus.PROCESSING
        session.video_path = video_path
        session.updated_at = datetime.utcnow()
        if job_description:
            session.job_description = job_description
        store.save(session)

        start = time.time()
        try:
            await self._set_progress(session_id, "transcription", 8, "Extracting and transcribing speech...")
            if is_demo:
                transcript = await whisper_service._transcribe_mock()
            else:
                audio_path = await whisper_service.extract_audio(video_path)
                transcript = await whisper_service.transcribe(audio_path)
            await self._set_progress(
                session_id, "transcription", 28, f"Transcribed {transcript.word_count} words"
            )

            await self._set_progress(session_id, "emotion_analysis", 34, "Analyzing facial expressions...")
            if is_demo:
                emotion_timeline = await deepface_service._analyze_mock()
            else:
                emotion_timeline = await deepface_service.analyze_video(video_path)
            emotional_profile = deepface_service.build_emotional_profile(emotion_timeline)
            await self._set_progress(
                session_id, "emotion_analysis", 54, f"Analyzed {len(emotion_timeline)} frames"
            )

            await self._set_progress(session_id, "communication_analysis", 58, "Computing communication metrics...")
            communication_metrics = llm_service.analyze_communication_metrics(transcript)
            behavioral_signals = llm_service.analyze_behavioral_signals(emotional_profile)
            await self._set_progress(session_id, "communication_analysis", 66, "Communication analysis complete")

            await self._set_progress(session_id, "llm_analysis", 70, "Running AI behavioral analysis...")
            session = store.get(session_id)
            llm_analysis = await llm_service.generate_llm_analysis(
                transcript=transcript,
                communication=communication_metrics,
                emotional=emotional_profile,
                behavioral=behavioral_signals,
                position=session.position if session else None,
                job_description=(session.job_description if session else None) or job_description,
            )
            await self._set_progress(session_id, "llm_analysis", 88, "Behavioral analysis complete")

            await self._set_progress(session_id, "report_generation", 92, "Generating evaluation report...")
            overall_score = self._compute_overall_score(
                communication_metrics, emotional_profile, behavioral_signals
            )
            communication_score = (
                communication_metrics.clarity_score
                + communication_metrics.confidence_score
                + communication_metrics.coherence_score
            ) / 3
            emotional_intelligence_score = (
                emotional_profile.emotional_stability_score + emotional_profile.engagement_score
            ) / 2
            processing_time = time.time() - start

            mode = "demo" if is_demo else ("full" if whisper_service.status not in ("mock", "uninitialized") else "mock_fallback")
            report = CandidateReport(
                interview_id=session_id,
                candidate_name=session.candidate_name if session else None,
                position=session.position if session else None,
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
                analysis_mode=mode,
            )

            session = store.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} disappeared")
            session.status = InterviewStatus.COMPLETED
            session.report = report
            session.stage = "complete"
            session.progress = 100
            session.message = "Analysis complete"
            session.updated_at = datetime.utcnow()
            store.save(session)
            logger.info("Analysis complete for %s in %.1fs", session_id, processing_time)
            return report
        except Exception as exc:
            session = store.get(session_id)
            if session:
                session.status = InterviewStatus.FAILED
                session.error_message = str(exc)
                session.stage = "error"
                session.progress = 0
                session.message = f"Analysis failed: {exc}"
                session.updated_at = datetime.utcnow()
                store.save(session)
            logger.error("Analysis failed for %s: %s", session_id, exc, exc_info=True)
            raise

    def _compute_overall_score(self, communication, emotional, behavioral) -> float:
        weights = [
            (communication.clarity_score, 0.15),
            (communication.confidence_score, 0.15),
            (communication.coherence_score, 0.10),
            (communication.vocabulary_richness, 0.05),
            (emotional.emotional_stability_score, 0.15),
            (emotional.engagement_score, 0.15),
            (behavioral.eye_contact_score, 0.10),
            (behavioral.attentiveness_score, 0.10),
            (behavioral.authenticity_score, 0.05),
        ]
        return sum(score * weight for score, weight in weights)

    async def _set_progress(self, session_id: str, stage: str, progress: float, message: str) -> None:
        session = store.get(session_id)
        if not session:
            return
        session.stage = stage
        session.progress = progress
        session.message = message
        session.updated_at = datetime.utcnow()
        store.save(session)

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        return store.get(session_id)

    def list_sessions(self):
        return store.list()

    def delete_session(self, session_id: str) -> bool:
        return store.delete(session_id)


orchestrator = AnalysisOrchestrator()
