"""Communication metrics + LLM behavioral analysis (OpenAI / Anthropic / mock)."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Optional

from app.core.config import settings
from app.models.schemas import (
    BehavioralSignals,
    CommunicationMetrics,
    EmotionalProfile,
    LLMAnalysis,
    TranscriptData,
)

logger = logging.getLogger(__name__)
FILLER_WORDS = {"um", "uh", "like", "you know", "basically", "literally", "actually", "so", "right", "okay"}


class LLMService:
    def __init__(self) -> None:
        self.client = None
        self._provider = "mock"
        self.status = "mock"

    async def initialize(self) -> None:
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI

                self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                self._provider = "openai"
                self.status = f"openai:{settings.LLM_MODEL}"
                return
            except Exception as exc:
                logger.warning("OpenAI init failed: %s", exc)
        if settings.ANTHROPIC_API_KEY:
            try:
                import anthropic

                self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                self._provider = "anthropic"
                self.status = "anthropic:claude"
                return
            except Exception as exc:
                logger.warning("Anthropic init failed: %s", exc)
        self._provider = "mock"
        self.status = "mock"

    def analyze_communication_metrics(self, transcript: TranscriptData) -> CommunicationMetrics:
        words = transcript.full_text.lower().split()
        total = len(words) or 1
        filler = sum(1 for w in words if w in FILLER_WORDS)
        filler_ratio = filler / total
        unique = len(set(words))
        vocab = min(10.0, (unique / total) * 20)
        avg_seg = total / len(transcript.segments) if transcript.segments else 0
        clarity = max(0.0, 10 - filler_ratio * 20 - max(0.0, (avg_seg - 30) * 0.05))
        wpm_score = min(10.0, max(0.0, (transcript.words_per_minute - 80) / 20))
        avg_conf = (
            sum(s.confidence for s in transcript.segments) / len(transcript.segments)
            if transcript.segments
            else 0.7
        )
        conf_score = (wpm_score + avg_conf * 10) / 2
        transitions = {"however", "therefore", "furthermore", "additionally", "consequently", "because"}
        trans_count = sum(1 for w in words if w in transitions)
        coherence = min(10.0, 5 + trans_count * 0.5 + min(3.0, len(transcript.segments) * 0.3))
        stop = {
            "i", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
            "with", "by", "from", "is", "was", "are", "were", "my", "we", "you",
        }
        freq = {}
        for w in words:
            if w not in stop and len(w) > 4:
                freq[w] = freq.get(w, 0) + 1
        themes = [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:8]]
        notable = [s.text for s in sorted(transcript.segments, key=lambda x: x.confidence, reverse=True)[:3]]
        return CommunicationMetrics(
            clarity_score=round(clarity, 1),
            confidence_score=round(conf_score, 1),
            coherence_score=round(coherence, 1),
            vocabulary_richness=round(vocab, 1),
            filler_word_ratio=round(filler_ratio, 3),
            average_response_length=round(avg_seg, 1),
            key_themes=themes or ["leadership", "systems", "mentorship"],
            notable_phrases=notable,
        )

    def analyze_behavioral_signals(self, ep: EmotionalProfile) -> BehavioralSignals:
        eye = min(10.0, (ep.engagement_score + ep.emotional_stability_score) / 2 + 1)
        att = min(10.0, ep.engagement_score * 1.1)
        variety = len([e for e, v in ep.emotion_distribution.items() if v > 0.05])
        auth = min(10.0, variety * 1.5 + ep.emotional_stability_score * 0.3)
        posture = (
            "Upright and engaged"
            if ep.emotional_stability_score > 7
            else "Generally composed"
            if ep.emotional_stability_score > 5
            else "Some signs of nervousness"
        )
        gesture = (
            "Active"
            if ep.engagement_score > 7
            else "Moderate"
            if ep.engagement_score > 4
            else "Minimal"
        )
        return BehavioralSignals(
            eye_contact_score=round(eye, 1),
            posture_assessment=posture,
            gesture_frequency=gesture,
            attentiveness_score=round(att, 1),
            authenticity_score=round(auth, 1),
        )

    async def generate_llm_analysis(
        self,
        transcript: TranscriptData,
        communication: CommunicationMetrics,
        emotional: EmotionalProfile,
        behavioral: BehavioralSignals,
        position: Optional[str] = None,
        job_description: Optional[str] = None,
    ) -> LLMAnalysis:
        await self.initialize()
        if self._provider == "openai":
            try:
                return await self._openai_analysis(
                    transcript, communication, emotional, behavioral, position, job_description
                )
            except Exception as exc:
                logger.warning("OpenAI analysis failed, using mock: %s", exc)
        if self._provider == "anthropic":
            try:
                return await self._anthropic_analysis(
                    transcript, communication, emotional, behavioral, position, job_description
                )
            except Exception as exc:
                logger.warning("Anthropic analysis failed, using mock: %s", exc)
        return await self._llm_analysis_mock(
            transcript, communication, emotional, behavioral, position
        )

    def _prompt(self, transcript, communication, emotional, behavioral, position, job_description) -> str:
        return f"""You are an expert interview evaluator. Return ONLY valid JSON with keys:
overall_assessment (string), strengths (string[]), areas_for_improvement (string[]),
culture_fit_indicators (string[]), red_flags (string[]), recommended_follow_up_questions (string[]),
hiring_recommendation (one of: Strong Yes, Yes, Maybe, No, Strong No),
confidence_in_recommendation (0-1 number).

Position: {position or "Not specified"}
Job description: {job_description or "Not provided"}
Transcript excerpt: {transcript.full_text[:2500]}
Communication: clarity={communication.clarity_score}, confidence={communication.confidence_score},
coherence={communication.coherence_score}, vocab={communication.vocabulary_richness},
filler_ratio={communication.filler_word_ratio}, themes={communication.key_themes}
Emotion: dominant={emotional.dominant_emotion}, stability={emotional.emotional_stability_score},
engagement={emotional.engagement_score}, stress={emotional.stress_indicators}
Behavioral: eye_contact={behavioral.eye_contact_score}, posture={behavioral.posture_assessment},
attentiveness={behavioral.attentiveness_score}, authenticity={behavioral.authenticity_score}
"""

    def _parse_llm_json(self, text: str) -> LLMAnalysis:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object in model response")
        return LLMAnalysis.model_validate(json.loads(match.group(0)))

    async def _openai_analysis(self, transcript, communication, emotional, behavioral, position, job_description):
        response = await self.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You evaluate interview candidates. Reply with JSON only."},
                {
                    "role": "user",
                    "content": self._prompt(
                        transcript, communication, emotional, behavioral, position, job_description
                    ),
                },
            ],
        )
        return self._parse_llm_json(response.choices[0].message.content or "{}")

    async def _anthropic_analysis(self, transcript, communication, emotional, behavioral, position, job_description):
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1500,
            temperature=0.3,
            messages=[
                {
                    "role": "user",
                    "content": self._prompt(
                        transcript, communication, emotional, behavioral, position, job_description
                    ),
                }
            ],
        )
        text = "".join(block.text for block in response.content if hasattr(block, "text"))
        return self._parse_llm_json(text)

    async def _llm_analysis_mock(self, transcript, comm, emo, beh, position: Optional[str] = None) -> LLMAnalysis:
        await asyncio.sleep(0.25)
        overall = (
            comm.clarity_score + comm.confidence_score + emo.emotional_stability_score + beh.eye_contact_score
        ) / 4
        role = position or "the role"
        strengths = []
        if comm.clarity_score > 7:
            strengths.append("Clear, structured storytelling with concrete outcomes")
        if comm.vocabulary_richness > 6:
            strengths.append("Precise vocabulary that signals technical depth")
        if emo.emotional_stability_score > 7:
            strengths.append("Composed under pressure with steady emotional presence")
        if emo.engagement_score > 6:
            strengths.append("High engagement and genuine enthusiasm for the work")
        if comm.filler_word_ratio < 0.05:
            strengths.append("Polished delivery with minimal filler language")
        while len(strengths) < 3:
            strengths.append("Ownership mindset visible in how past projects are described")

        areas = []
        if comm.filler_word_ratio > 0.08:
            areas.append("Reduce filler words to project greater confidence")
        if comm.confidence_score < 6:
            areas.append("Slow pacing slightly to strengthen perceived confidence")
        if emo.stress_indicators:
            areas.append("Manage early-interview tension with a short grounding pause")
        while len(areas) < 2:
            areas.append("Add more quantified impact when describing achievements")

        if overall > 8:
            rec = "Strong Yes"
        elif overall > 6.5:
            rec = "Yes"
        elif overall > 5:
            rec = "Maybe"
        elif overall > 3.5:
            rec = "No"
        else:
            rec = "Strong No"

        return LLMAnalysis(
            overall_assessment=(
                f"Candidate shows {'strong' if overall > 7 else 'solid'} potential for {role} "
                f"with a composite signal of {overall:.1f}/10. Communication is "
                f"{'excellent' if comm.clarity_score > 7 else 'adequate'} and emotional presence is "
                f"{'highly stable' if emo.emotional_stability_score > 7 else 'generally composed'}."
            ),
            strengths=strengths[:5],
            areas_for_improvement=areas[:4],
            culture_fit_indicators=[
                "Collaborative language when describing team delivery",
                "Growth orientation when reflecting on challenges",
                "Bias toward clarity and written communication",
                "Ownership of reliability and mentoring outcomes",
            ],
            red_flags=[s for s in emo.stress_indicators if "frustration" in s.lower()],
            recommended_follow_up_questions=[
                "Walk me through a specific failure and what you changed afterward.",
                "How do you handle disagreement with leadership decisions?",
                "Describe mentoring a junior engineer through a hard project.",
                "What is the most complex technical trade-off you have owned?",
            ],
            hiring_recommendation=rec,
            confidence_in_recommendation=round(min(0.95, overall / 10 + 0.1), 2),
        )


llm_service = LLMService()
