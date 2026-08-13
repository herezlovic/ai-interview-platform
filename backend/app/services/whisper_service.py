"""Speech-to-text via Whisper (local / OpenAI) with demo + mock fallbacks."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from app.core.config import settings
from app.models.schemas import SpeechSegment, TranscriptData

logger = logging.getLogger(__name__)

DEMO_SEGMENTS = [
    (0.0, 12.5, "Thanks for having me. I've spent the last five years building backend systems at scale, mostly around payments and marketplace infrastructure."),
    (12.5, 28.0, "In my current role I led a migration from a monolith to services. We cut p99 latency by about forty percent and made releases much safer."),
    (28.0, 45.5, "I care a lot about clarity in design docs and mentorship. I usually pair with newer engineers and leave the codebase in better shape than I found it."),
    (45.5, 62.0, "When things go wrong I try to stay calm, write down what we know, and communicate early. Under pressure I focus on the highest-leverage next step."),
    (62.0, 78.0, "I'm excited about this role because of the product ambition and the chance to own reliability end to end. Happy to go deeper on any of those projects."),
]


class WhisperService:
    def __init__(self) -> None:
        self.model = None
        self._initialized = False
        self.status = "uninitialized"

    async def initialize(self) -> None:
        if self._initialized:
            return
        provider = settings.WHISPER_PROVIDER
        if provider == "mock":
            self.status = "mock"
            self._initialized = True
            return
        if provider in ("auto", "local"):
            try:
                import whisper

                logger.info("Loading Whisper model: %s", settings.WHISPER_MODEL)
                self.model = await asyncio.get_event_loop().run_in_executor(
                    None, whisper.load_model, settings.WHISPER_MODEL
                )
                self.status = "local"
                self._initialized = True
                return
            except Exception as exc:
                logger.warning("Local Whisper unavailable: %s", exc)
                if provider == "local":
                    self.status = "mock"
                    self._initialized = True
                    return
        if provider in ("auto", "openai") and settings.OPENAI_API_KEY:
            self.status = "openai"
            self._initialized = True
            return
        self.status = "mock"
        self._initialized = True

    def is_demo_path(self, path: str) -> bool:
        return path.startswith("demo://") or path == ""

    async def extract_audio(self, video_path: str) -> str:
        if self.is_demo_path(video_path):
            return "demo://audio"
        audio_path = str(Path(video_path).with_suffix(".wav"))
        cmd = [
            "ffmpeg", "-i", video_path, "-vn",
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", "-y", audio_path,
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {stderr.decode()[:500]}")
        return audio_path

    async def transcribe(self, audio_path: str) -> TranscriptData:
        await self.initialize()
        if self.is_demo_path(audio_path) or self.status == "mock":
            return await self._transcribe_mock()
        if self.status == "local" and self.model is not None:
            return await self._transcribe_local(audio_path)
        if self.status == "openai":
            return await self._transcribe_openai(audio_path)
        return await self._transcribe_mock()

    async def _transcribe_local(self, audio_path: str) -> TranscriptData:
        result = await asyncio.get_event_loop().run_in_executor(
            None, lambda: self.model.transcribe(audio_path, verbose=False)
        )
        segments = [
            SpeechSegment(
                start=float(s["start"]),
                end=float(s["end"]),
                text=s["text"].strip(),
                confidence=0.9,
            )
            for s in result.get("segments", [])
        ]
        full_text = result.get("text", "").strip()
        duration = segments[-1].end if segments else 0.0
        words = full_text.split()
        wpm = (len(words) / duration * 60) if duration > 0 else 0
        return TranscriptData(
            full_text=full_text,
            segments=segments,
            language=result.get("language", "en"),
            duration=duration,
            word_count=len(words),
            words_per_minute=round(wpm, 1),
        )

    async def _transcribe_openai(self, audio_path: str) -> TranscriptData:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        with open(audio_path, "rb") as f:
            result = await client.audio.transcriptions.create(
                model="whisper-1", file=f, response_format="verbose_json"
            )
        segments = [
            SpeechSegment(
                start=float(s.start),
                end=float(s.end),
                text=s.text.strip(),
                confidence=0.92,
            )
            for s in (result.segments or [])
        ]
        full_text = result.text.strip()
        duration = float(getattr(result, "duration", 0) or (segments[-1].end if segments else 0))
        words = full_text.split()
        wpm = (len(words) / duration * 60) if duration > 0 else 0
        return TranscriptData(
            full_text=full_text,
            segments=segments,
            language=getattr(result, "language", "en") or "en",
            duration=duration,
            word_count=len(words),
            words_per_minute=round(wpm, 1),
        )

    async def _transcribe_mock(self) -> TranscriptData:
        await asyncio.sleep(0.4)
        segments = [
            SpeechSegment(start=a, end=b, text=t, confidence=0.94)
            for a, b, t in DEMO_SEGMENTS
        ]
        full_text = " ".join(t for _, _, t in DEMO_SEGMENTS)
        duration = DEMO_SEGMENTS[-1][1]
        words = full_text.split()
        return TranscriptData(
            full_text=full_text,
            segments=segments,
            language="en",
            duration=duration,
            word_count=len(words),
            words_per_minute=round(len(words) / duration * 60, 1),
        )


whisper_service = WhisperService()
