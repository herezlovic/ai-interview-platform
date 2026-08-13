"""Facial emotion analysis via DeepFace with demo + mock fallbacks."""

from __future__ import annotations

import asyncio
import logging
from typing import List

import numpy as np

from app.core.config import settings
from app.models.schemas import EmotionData, EmotionalProfile

logger = logging.getLogger(__name__)
EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


class DeepFaceService:
    def __init__(self) -> None:
        self._deepface_available = False
        self._cv2_available = False
        self.status = "uninitialized"

    async def initialize(self) -> None:
        try:
            import cv2  # noqa: F401

            self._cv2_available = True
        except ImportError:
            logger.warning("OpenCV not installed — using mock emotion detection")

        try:
            from deepface import DeepFace  # noqa: F401

            self._deepface_available = True
        except ImportError:
            logger.warning("DeepFace not installed — using mock emotion detection")

        if self._cv2_available and self._deepface_available:
            self.status = "ready"
        else:
            self.status = "mock"

    def is_demo_path(self, path: str) -> bool:
        return path.startswith("demo://") or path == ""

    async def analyze_video(self, video_path: str) -> List[EmotionData]:
        await self.initialize()
        if self.is_demo_path(video_path) or self.status == "mock":
            return await self._analyze_mock()
        return await self._analyze_real(video_path)

    async def _analyze_real(self, video_path: str) -> List[EmotionData]:
        import cv2
        from deepface import DeepFace

        def process_video():
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_interval = max(1, int(fps * settings.FRAME_SAMPLE_RATE))
            frame_count = 0
            results = []
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_count % frame_interval == 0:
                    timestamp = frame_count / fps
                    try:
                        analysis = DeepFace.analyze(
                            frame,
                            actions=["emotion"],
                            enforce_detection=False,
                            silent=True,
                        )
                        if isinstance(analysis, list):
                            analysis = analysis[0]
                        emotions = {k.lower(): float(v) / 100.0 for k, v in analysis["emotion"].items()}
                        dominant = analysis["dominant_emotion"].lower()
                        results.append(
                            EmotionData(
                                timestamp=round(timestamp, 2),
                                dominant_emotion=dominant,
                                emotions=emotions,
                                confidence=float(emotions.get(dominant, 0.5)),
                            )
                        )
                    except Exception:
                        pass
                frame_count += 1
            cap.release()
            return results

        return await asyncio.get_event_loop().run_in_executor(None, process_video)

    async def _analyze_mock(self) -> List[EmotionData]:
        await asyncio.sleep(0.35)
        rng = np.random.default_rng(42)
        timeline: List[EmotionData] = []
        for i in range(16):
            ts = i * 5.0
            weights = {
                "neutral": 0.45 + float(rng.random()) * 0.15,
                "happy": 0.18 + float(rng.random()) * 0.12,
                "surprise": 0.05 + float(rng.random()) * 0.05,
                "fear": 0.04 + float(rng.random()) * 0.04,
                "sad": 0.03 + float(rng.random()) * 0.03,
                "angry": 0.02,
                "disgust": 0.01,
            }
            total = sum(weights.values())
            emotions = {k: round(v / total, 3) for k, v in weights.items()}
            dominant = max(emotions, key=emotions.get)
            timeline.append(
                EmotionData(
                    timestamp=ts,
                    dominant_emotion=dominant,
                    emotions=emotions,
                    confidence=emotions[dominant],
                )
            )
        return timeline

    def build_emotional_profile(self, timeline: List[EmotionData]) -> EmotionalProfile:
        if not timeline:
            timeline = []
        dist = {e: 0.0 for e in EMOTION_LABELS}
        for item in timeline:
            for emotion, value in item.emotions.items():
                key = emotion.lower()
                if key in dist:
                    dist[key] += value
        n = max(len(timeline), 1)
        dist = {k: round(v / n, 3) for k, v in dist.items()}
        dominant = max(dist, key=dist.get) if dist else "neutral"
        variance = float(np.var([item.confidence for item in timeline])) if timeline else 0.1
        stability = max(0.0, min(10.0, 9.2 - variance * 12))
        engagement = max(0.0, min(10.0, (dist.get("happy", 0) + dist.get("surprise", 0)) * 18 + 4.5))
        stress = []
        if dist.get("fear", 0) > 0.08:
            stress.append("Elevated tension cues in early responses")
        if dist.get("angry", 0) > 0.05:
            stress.append("Brief frustration signals under probing questions")
        positives = []
        if dist.get("happy", 0) > 0.15:
            positives.append("Warm, approachable presence")
        if stability > 7:
            positives.append("Steady composure across the interview")
        if engagement > 6:
            positives.append("Consistent engagement with the interviewer")
        if not positives:
            positives.append("Maintained professional affect throughout")
        return EmotionalProfile(
            dominant_emotion=dominant,
            emotion_distribution=dist,
            emotional_stability_score=round(stability, 1),
            engagement_score=round(engagement, 1),
            stress_indicators=stress,
            positive_signals=positives,
            timeline=timeline,
        )


deepface_service = DeepFaceService()
