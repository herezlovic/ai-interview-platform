"""
Facial Emotion Detection Service using DeepFace
Analyzes video frames to detect emotional states throughout the interview
"""

import asyncio
import logging
import os
from typing import List, Optional
import numpy as np

from app.core.config import settings
from app.models.schemas import EmotionData, EmotionalProfile

logger = logging.getLogger(__name__)

EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


class DeepFaceService:
    """
    Handles facial emotion analysis using DeepFace.
    Samples video frames at configured intervals and returns emotion timeline.
    """

    def __init__(self):
        self._deepface_available = False
        self._cv2_available = False

    async def initialize(self):
        """Check for DeepFace and OpenCV availability"""
        try:
            import cv2
            self._cv2_available = True
        except ImportError:
            logger.warning("OpenCV not installed. Using mock emotion detection.")

        try:
            from deepface import DeepFace
            self._deepface_available = True
            logger.info("DeepFace loaded successfully")
        except ImportError:
            logger.warning("DeepFace not installed. Using mock emotion detection.")

    async def analyze_video(self, video_path: str) -> List[EmotionData]:
        """Extract and analyze facial emotions from video frames"""
        await self.initialize()

        if self._cv2_available and self._deepface_available:
            return await self._analyze_real(video_path)
        else:
            return await self._analyze_mock(video_path)

    async def _analyze_real(self, video_path: str) -> List[EmotionData]:
        """Real DeepFace analysis on video frames"""
        import cv2
        from deepface import DeepFace

        emotion_timeline = []

        def process_video():
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_interval = int(fps * settings.FRAME_SAMPLE_RATE)
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
                        if analysis:
                            emotions = analysis[0]["emotion"]
                            dominant = analysis[0]["dominant_emotion"]
                            results.append(EmotionData(
                                timestamp=timestamp,
                                dominant_emotion=dominant,
                                emotions={k: v / 100 for k, v in emotions.items()},
                                confidence=emotions.get(dominant, 0) / 100,
                            ))
                    except Exception as e:
                        logger.debug(f"Frame analysis skipped at {timestamp}s: {e}")

                frame_count += 1

            cap.release()
            return results

        emotion_timeline = await asyncio.get_event_loop().run_in_executor(
            None, process_video
        )

        logger.info(f"Analyzed {len(emotion_timeline)} frames from {video_path}")
        return emotion_timeline

    async def _analyze_mock(self, video_path: str) -> List[EmotionData]:
        """Generate realistic mock emotion data for demo purposes"""
        await asyncio.sleep(0.5)

        # Simulate realistic interview emotion patterns
        emotion_patterns = [
            (0, "neutral", {"neutral": 0.55, "happy": 0.25, "surprise": 0.1, "fear": 0.05, "angry": 0.03, "sad": 0.01, "disgust": 0.01}),
            (5, "happy", {"neutral": 0.3, "happy": 0.55, "surprise": 0.08, "fear": 0.03, "angry": 0.02, "sad": 0.01, "disgust": 0.01}),
            (10, "neutral", {"neutral": 0.6, "happy": 0.2, "surprise": 0.08, "fear": 0.07, "angry": 0.03, "sad": 0.01, "disgust": 0.01}),
            (15, "neutral", {"neutral": 0.65, "happy": 0.15, "surprise": 0.1, "fear": 0.05, "angry": 0.02, "sad": 0.02, "disgust": 0.01}),
            (20, "happy", {"neutral": 0.25, "happy": 0.6, "surprise": 0.08, "fear": 0.03, "angry": 0.02, "sad": 0.01, "disgust": 0.01}),
            (25, "neutral", {"neutral": 0.58, "happy": 0.22, "surprise": 0.1, "fear": 0.05, "angry": 0.03, "sad": 0.01, "disgust": 0.01}),
            (30, "fear", {"neutral": 0.35, "happy": 0.1, "surprise": 0.15, "fear": 0.28, "angry": 0.07, "sad": 0.04, "disgust": 0.01}),
            (35, "neutral", {"neutral": 0.52, "happy": 0.2, "surprise": 0.12, "fear": 0.1, "angry": 0.03, "sad": 0.02, "disgust": 0.01}),
            (40, "happy", {"neutral": 0.28, "happy": 0.58, "surprise": 0.07, "fear": 0.03, "angry": 0.02, "sad": 0.01, "disgust": 0.01}),
            (50, "neutral", {"neutral": 0.62, "happy": 0.2, "surprise": 0.08, "fear": 0.05, "angry": 0.03, "sad": 0.01, "disgust": 0.01}),
            (60, "surprise", {"neutral": 0.3, "happy": 0.2, "surprise": 0.35, "fear": 0.08, "angry": 0.04, "sad": 0.02, "disgust": 0.01}),
            (70, "happy", {"neutral": 0.25, "happy": 0.62, "surprise": 0.06, "fear": 0.03, "angry": 0.02, "sad": 0.01, "disgust": 0.01}),
            (80, "neutral", {"neutral": 0.6, "happy": 0.22, "surprise": 0.08, "fear": 0.05, "angry": 0.03, "sad": 0.01, "disgust": 0.01}),
            (88, "happy", {"neutral": 0.22, "happy": 0.65, "surprise": 0.07, "fear": 0.02, "angry": 0.02, "sad": 0.01, "disgust": 0.01}),
        ]

        return [
            EmotionData(
                timestamp=float(ts),
                dominant_emotion=emotion,
                emotions=emotions,
                confidence=emotions[emotion],
            )
            for ts, emotion, emotions in emotion_patterns
        ]

    def build_emotional_profile(self, emotion_timeline: List[EmotionData]) -> EmotionalProfile:
        """Aggregate emotion timeline into a comprehensive emotional profile"""
        if not emotion_timeline:
            return self._empty_profile()

        # Aggregate emotion distributions
        emotion_totals = {e: 0.0 for e in EMOTION_LABELS}
        for frame in emotion_timeline:
            for emotion, score in frame.emotions.items():
                if emotion in emotion_totals:
                    emotion_totals[emotion] += score

        total = sum(emotion_totals.values())
        distribution = {k: round(v / total, 3) for k, v in emotion_totals.items()} if total > 0 else emotion_totals

        # Dominant emotion
        dominant = max(distribution, key=distribution.get)

        # Emotional stability: low variance in dominant emotion = more stable
        dominant_scores = [f.emotions.get(f.dominant_emotion, 0) for f in emotion_timeline]
        variance = float(np.var(dominant_scores)) if dominant_scores else 0
        stability_score = max(0, min(10, 10 - variance * 20))

        # Engagement: combination of non-neutral expressions
        engagement = 1 - distribution.get("neutral", 0.5)
        engagement_score = min(10, engagement * 15)

        # Stress indicators
        stress_indicators = []
        if distribution.get("fear", 0) > 0.15:
            stress_indicators.append("Elevated anxiety detected during interview")
        if distribution.get("angry", 0) > 0.1:
            stress_indicators.append("Frustration signals present")
        if distribution.get("disgust", 0) > 0.05:
            stress_indicators.append("Signs of discomfort with certain questions")

        # Positive signals
        positive_signals = []
        if distribution.get("happy", 0) > 0.25:
            positive_signals.append("Genuine enthusiasm and positive affect")
        if stability_score > 7:
            positive_signals.append("Emotionally composed and stable under pressure")
        if distribution.get("surprise", 0) > 0.08:
            positive_signals.append("Active engagement and intellectual curiosity")
        if not stress_indicators:
            positive_signals.append("No significant stress or anxiety markers")

        return EmotionalProfile(
            dominant_emotion=dominant,
            emotion_distribution=distribution,
            emotional_stability_score=round(stability_score, 1),
            engagement_score=round(engagement_score, 1),
            stress_indicators=stress_indicators,
            positive_signals=positive_signals,
            timeline=emotion_timeline,
        )

    def _empty_profile(self) -> EmotionalProfile:
        return EmotionalProfile(
            dominant_emotion="neutral",
            emotion_distribution={e: 0.0 for e in EMOTION_LABELS},
            emotional_stability_score=5.0,
            engagement_score=5.0,
            stress_indicators=[],
            positive_signals=[],
            timeline=[],
        )


deepface_service = DeepFaceService()
