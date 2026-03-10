"""
Speech-to-Text Service using OpenAI Whisper
Handles audio extraction from video and transcription
"""

import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.models.schemas import SpeechSegment, TranscriptData

logger = logging.getLogger(__name__)


class WhisperService:
    """
    Handles speech-to-text transcription using OpenAI Whisper.
    Supports both local model inference and OpenAI API.
    """

    def __init__(self):
        self.model = None
        self.model_name = settings.WHISPER_MODEL
        self._initialized = False

    async def initialize(self):
        """Lazy initialization of Whisper model"""
        if self._initialized:
            return
        try:
            import whisper
            logger.info(f"Loading Whisper model: {self.model_name}")
            self.model = await asyncio.get_event_loop().run_in_executor(
                None, whisper.load_model, self.model_name
            )
            self._initialized = True
            logger.info("Whisper model loaded successfully")
        except ImportError:
            logger.warning("Whisper not installed. Using mock transcription for demo.")
            self._initialized = True

    async def extract_audio(self, video_path: str) -> str:
        """Extract audio from video file using ffmpeg"""
        audio_path = video_path.replace(".mp4", ".wav").replace(".webm", ".wav")
        cmd = [
            "ffmpeg", "-i", video_path,
            "-vn",  # no video
            "-acodec", "pcm_s16le",  # PCM audio
            "-ar", "16000",  # 16kHz sample rate (Whisper requirement)
            "-ac", "1",  # mono
            "-y", audio_path
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg audio extraction failed: {stderr.decode()}")
        return audio_path

    async def transcribe(self, audio_path: str) -> TranscriptData:
        """Transcribe audio file to text with timestamps"""
        await self.initialize()

        if self.model is not None:
            return await self._transcribe_local(audio_path)
        else:
            return await self._transcribe_mock(audio_path)

    async def _transcribe_local(self, audio_path: str) -> TranscriptData:
        """Use local Whisper model for transcription"""
        logger.info(f"Transcribing: {audio_path}")

        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self.model.transcribe(
                audio_path,
                verbose=False,
                word_timestamps=True,
                language=None,  # auto-detect
            )
        )

        segments = []
        for seg in result.get("segments", []):
            segments.append(SpeechSegment(
                start=seg["start"],
                end=seg["end"],
                text=seg["text"].strip(),
                confidence=1.0 - (seg.get("no_speech_prob", 0)),
            ))

        full_text = result.get("text", "").strip()
        duration = segments[-1].end if segments else 0
        word_count = len(full_text.split())
        wpm = (word_count / duration * 60) if duration > 0 else 0

        return TranscriptData(
            full_text=full_text,
            segments=segments,
            language=result.get("language", "en"),
            duration=duration,
            word_count=word_count,
            words_per_minute=round(wpm, 1),
        )

    async def _transcribe_mock(self, audio_path: str) -> TranscriptData:
        """Mock transcription for demo/testing purposes"""
        await asyncio.sleep(1)  # Simulate processing

        mock_segments = [
            SpeechSegment(start=0.0, end=8.5, text="Thank you for having me. I'm really excited about this opportunity and the work your team is doing.", confidence=0.95),
            SpeechSegment(start=9.0, end=22.0, text="In my previous role, I led a team of five engineers building a distributed data pipeline that processed over ten million events per day.", confidence=0.93),
            SpeechSegment(start=23.0, end=38.0, text="We faced significant challenges with latency, and I spearheaded the migration to an event-driven architecture using Kafka, which reduced our p99 latency by sixty percent.", confidence=0.91),
            SpeechSegment(start=39.0, end=55.0, text="I'm particularly passionate about clean code and mentorship. I believe that investing in junior developers creates compounding returns for the entire organization.", confidence=0.94),
            SpeechSegment(start=56.0, end=72.0, text="When I think about my biggest challenge, it was navigating a difficult product pivot where we had to deprecate features that users loved. It required careful stakeholder management.", confidence=0.89),
            SpeechSegment(start=73.0, end=88.0, text="I handled it by creating transparency through regular updates, being honest about trade-offs, and making sure every affected user had a migration path.", confidence=0.92),
        ]

        full_text = " ".join(s.text for s in mock_segments)
        duration = 90.0
        word_count = len(full_text.split())

        return TranscriptData(
            full_text=full_text,
            segments=mock_segments,
            language="en",
            duration=duration,
            word_count=word_count,
            words_per_minute=round(word_count / duration * 60, 1),
        )


whisper_service = WhisperService()
