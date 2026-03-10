from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum
from datetime import datetime
import uuid

class InterviewStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class EmotionData(BaseModel):
    timestamp: float
    dominant_emotion: str
    emotions: Dict[str, float]
    confidence: float

class SpeechSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: Optional[str] = None
    confidence: float

class TranscriptData(BaseModel):
    full_text: str
    segments: List[SpeechSegment]
    language: str
    duration: float
    word_count: int
    words_per_minute: float

class CommunicationMetrics(BaseModel):
    clarity_score: float = Field(..., ge=0, le=10)
    confidence_score: float = Field(..., ge=0, le=10)
    coherence_score: float = Field(..., ge=0, le=10)
    vocabulary_richness: float = Field(..., ge=0, le=10)
    filler_word_ratio: float
    average_response_length: float
    key_themes: List[str]
    notable_phrases: List[str]

class EmotionalProfile(BaseModel):
    dominant_emotion: str
    emotion_distribution: Dict[str, float]
    emotional_stability_score: float = Field(..., ge=0, le=10)
    engagement_score: float = Field(..., ge=0, le=10)
    stress_indicators: List[str]
    positive_signals: List[str]
    timeline: List[EmotionData]

class BehavioralSignals(BaseModel):
    eye_contact_score: float = Field(..., ge=0, le=10)
    posture_assessment: str
    gesture_frequency: str
    attentiveness_score: float = Field(..., ge=0, le=10)
    authenticity_score: float = Field(..., ge=0, le=10)

class LLMAnalysis(BaseModel):
    overall_assessment: str
    strengths: List[str]
    areas_for_improvement: List[str]
    culture_fit_indicators: List[str]
    red_flags: List[str]
    recommended_follow_up_questions: List[str]
    hiring_recommendation: str
    confidence_in_recommendation: float = Field(..., ge=0, le=1)

class CandidateReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    candidate_name: Optional[str] = None
    position: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    overall_score: float = Field(..., ge=0, le=10)
    technical_score: Optional[float] = Field(None, ge=0, le=10)
    communication_score: float = Field(..., ge=0, le=10)
    emotional_intelligence_score: float = Field(..., ge=0, le=10)
    transcript: TranscriptData
    communication_metrics: CommunicationMetrics
    emotional_profile: EmotionalProfile
    behavioral_signals: BehavioralSignals
    llm_analysis: LLMAnalysis
    video_duration: float
    processing_time: float

class InterviewSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_name: Optional[str] = None
    position: Optional[str] = None
    interviewer: Optional[str] = None
    status: InterviewStatus = InterviewStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    video_path: Optional[str] = None
    report: Optional[CandidateReport] = None
    error_message: Optional[str] = None

class ProcessingUpdate(BaseModel):
    interview_id: str
    stage: str
    progress: float
    message: str
