import asyncio, json, logging, re
from typing import Optional
from app.core.config import settings
from app.models.schemas import BehavioralSignals, CommunicationMetrics, EmotionalProfile, LLMAnalysis, TranscriptData

logger = logging.getLogger(__name__)
FILLER_WORDS = {"um","uh","like","you know","basically","literally","actually","so","right","okay"}

class LLMService:
    def __init__(self):
        self.client = None
        self._provider = None

    async def initialize(self):
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                self._provider = "openai"; return
            except ImportError: pass
        if settings.ANTHROPIC_API_KEY:
            try:
                import anthropic
                self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                self._provider = "anthropic"; return
            except ImportError: pass
        self._provider = "mock"

    def analyze_communication_metrics(self, transcript: TranscriptData) -> CommunicationMetrics:
        words = transcript.full_text.lower().split()
        total = len(words)
        filler = sum(1 for w in words if w in FILLER_WORDS)
        filler_ratio = filler / total if total > 0 else 0
        unique = len(set(words))
        vocab = min(10, (unique / total) * 20) if total > 0 else 0
        avg_seg = total / len(transcript.segments) if transcript.segments else 0
        clarity = max(0, 10 - filler_ratio * 20 - max(0, (avg_seg - 30) * 0.05))
        wpm_score = min(10, max(0, (transcript.words_per_minute - 80) / 20))
        avg_conf = sum(s.confidence for s in transcript.segments) / len(transcript.segments) if transcript.segments else 0.7
        conf_score = (wpm_score + avg_conf * 10) / 2
        transitions = {"however","therefore","furthermore","additionally","consequently"}
        trans_count = sum(1 for w in words if w in transitions)
        coherence = min(10, 5 + trans_count * 0.5)
        stop = {"i","the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","was","are","were"}
        freq = {}
        for w in words:
            if w not in stop and len(w) > 4: freq[w] = freq.get(w, 0) + 1
        themes = [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:8]]
        notable = [s.text for s in sorted(transcript.segments, key=lambda x: x.confidence, reverse=True)[:3]]
        return CommunicationMetrics(clarity_score=round(clarity,1), confidence_score=round(conf_score,1), coherence_score=round(coherence,1), vocabulary_richness=round(vocab,1), filler_word_ratio=round(filler_ratio,3), average_response_length=round(avg_seg,1), key_themes=themes, notable_phrases=notable)

    def analyze_behavioral_signals(self, ep: EmotionalProfile) -> BehavioralSignals:
        eye = min(10, (ep.engagement_score + ep.emotional_stability_score) / 2 + 1)
        att = min(10, ep.engagement_score * 1.1)
        variety = len([e for e, v in ep.emotion_distribution.items() if v > 0.05])
        auth = min(10, variety * 1.5 + ep.emotional_stability_score * 0.3)
        posture = "Upright and engaged" if ep.emotional_stability_score > 7 else "Generally composed" if ep.emotional_stability_score > 5 else "Some signs of nervousness"
        gesture = "Active" if ep.engagement_score > 7 else "Moderate" if ep.engagement_score > 4 else "Minimal"
        return BehavioralSignals(eye_contact_score=round(eye,1), posture_assessment=posture, gesture_frequency=gesture, attentiveness_score=round(att,1), authenticity_score=round(auth,1))

    async def generate_llm_analysis(self, transcript, communication, emotional, behavioral, position=None, job_description=None) -> LLMAnalysis:
        await self.initialize()
        return await self._llm_analysis_mock(transcript, communication, emotional, behavioral)

    async def _llm_analysis_mock(self, transcript, comm, emo, beh) -> LLMAnalysis:
        await asyncio.sleep(0.3)
        overall = (comm.clarity_score + comm.confidence_score + emo.emotional_stability_score + beh.eye_contact_score) / 4
        strengths = []
        if comm.clarity_score > 7: strengths.append("Exceptional communication clarity")
        if comm.vocabulary_richness > 6: strengths.append("Rich vocabulary demonstrating depth of knowledge")
        if emo.emotional_stability_score > 7: strengths.append("Strong emotional resilience under pressure")
        if emo.engagement_score > 6: strengths.append("High engagement and genuine enthusiasm")
        if comm.filler_word_ratio < 0.05: strengths.append("Polished delivery with minimal filler language")
        if len(strengths) < 3: strengths.append("Structured responses reflecting solid analytical thinking")
        areas = []
        if comm.filler_word_ratio > 0.08: areas.append("Reduce filler words to project greater confidence")
        if comm.confidence_score < 6: areas.append("Build confidence with slower, more deliberate pacing")
        if emo.stress_indicators: areas.append("Manage interview anxiety through preparation techniques")
        if len(areas) < 2: areas.append("Provide more quantitative evidence when describing achievements")
        rec = "Strong Yes" if overall > 8 else "Yes" if overall > 6.5 else "Maybe" if overall > 5 else "No"
        return LLMAnalysis(
            overall_assessment=f"Candidate demonstrates {'strong' if overall > 7 else 'solid'} potential with a composite score of {overall:.1f}/10. Communication is {'excellent' if comm.clarity_score > 7 else 'adequate'} with {'high' if comm.confidence_score > 7 else 'moderate'} confidence. Emotionally {'highly stable' if emo.emotional_stability_score > 7 else 'generally composed'} throughout.",
            strengths=strengths[:5], areas_for_improvement=areas[:4],
            culture_fit_indicators=["Collaborative mindset evident in team-oriented language","Growth orientation in reflections on challenges","Values transparency and honest communication","Shows initiative and ownership mentality"],
            red_flags=[s for s in emo.stress_indicators if "frustration" in s.lower()],
            recommended_follow_up_questions=["Walk me through a specific failure and what you learned.","How do you handle disagreement with leadership decisions?","Describe your approach to mentoring junior team members.","What's the most complex technical trade-off you've made?"],
            hiring_recommendation=rec,
            confidence_in_recommendation=min(0.95, overall / 10 + 0.1)
        )

llm_service = LLMService()
