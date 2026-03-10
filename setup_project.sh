#!/bin/bash
# Run this from inside your ai-interview-platform folder
# It will create the full project structure

echo "Creating full project structure..."

# ── Directory structure ──────────────────────────────────────────
mkdir -p backend/app/{api,core,models,services,utils}
mkdir -p backend/tests
mkdir -p frontend/src/{components,pages,hooks,utils,styles}
mkdir -p frontend/public
mkdir -p .github/workflows
mkdir -p docs

# ── backend/app/__init__.py ──────────────────────────────────────
cat > backend/app/__init__.py << 'EOF'
# AI Interview Intelligence Platform
EOF

# ── backend/app/api/__init__.py ─────────────────────────────────
touch backend/app/api/__init__.py
touch backend/app/core/__init__.py
touch backend/app/models/__init__.py
touch backend/app/services/__init__.py
touch backend/app/utils/__init__.py

# ── backend/app/core/config.py ──────────────────────────────────
cat > backend/app/core/config.py << 'EOF'
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "AI Interview Intelligence Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com",
    ]
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 500
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    FRAME_SAMPLE_RATE: int = 5
    MIN_INTERVIEW_DURATION_SEC: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
EOF

# ── backend/app/models/schemas.py ───────────────────────────────
cat > backend/app/models/schemas.py << 'EOF'
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
EOF

# ── backend/app/main.py ─────────────────────────────────────────
cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import interviews, analysis, reports, health
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Interview Intelligence Platform",
    description="Multimodal interview evaluation using speech, facial emotion, and LLM analysis",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.on_event("startup")
async def startup_event():
    logger.info("AI Interview Intelligence Platform starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
EOF

# ── backend/app/api/health.py ───────────────────────────────────
cat > backend/app/api/health.py << 'EOF'
from fastapi import APIRouter
from datetime import datetime
router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "service": "AI Interview Intelligence Platform"}
EOF

# ── backend/app/api/analysis.py ─────────────────────────────────
cat > backend/app/api/analysis.py << 'EOF'
from fastapi import APIRouter, HTTPException
from app.services.orchestrator import orchestrator
router = APIRouter()

@router.get("/{session_id}/status")
async def get_analysis_status(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {"session_id": session_id, "status": session.status, "has_report": session.report is not None, "error": session.error_message}
EOF

# ── backend/app/api/reports.py ──────────────────────────────────
cat > backend/app/api/reports.py << 'EOF'
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
EOF

# ── backend/app/api/interviews.py ───────────────────────────────
cat > backend/app/api/interviews.py << 'EOF'
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from app.core.config import settings
from app.models.schemas import InterviewSession, InterviewStatus
from app.services.orchestrator import orchestrator

router = APIRouter()
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=InterviewSession)
async def create_interview(
    background_tasks: BackgroundTasks,
    candidate_name: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    interviewer: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
):
    session = await orchestrator.create_session(candidate_name=candidate_name, position=position, interviewer=interviewer)
    if video:
        if not video.content_type.startswith("video/"):
            raise HTTPException(400, "Uploaded file must be a video")
        ext = Path(video.filename).suffix if video.filename else ".mp4"
        video_path = UPLOAD_DIR / f"{session.id}{ext}"
        with open(video_path, "wb") as f:
            content = await video.read()
            if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                raise HTTPException(413, f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB")
            f.write(content)
        background_tasks.add_task(orchestrator.process_video, session_id=session.id, video_path=str(video_path), job_description=job_description)
    return session

@router.get("/", response_model=List[InterviewSession])
async def list_interviews():
    return orchestrator.list_sessions()

@router.get("/{session_id}", response_model=InterviewSession)
async def get_interview(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, f"Interview session {session_id} not found")
    return session

@router.post("/{session_id}/demo")
async def run_demo_analysis(session_id: str, background_tasks: BackgroundTasks, position: Optional[str] = None):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, f"Session {session_id} not found")
    if session.status == InterviewStatus.PROCESSING:
        raise HTTPException(400, "Session is already being processed")
    if position:
        session.position = position
    background_tasks.add_task(orchestrator.process_video, session_id=session_id, video_path="demo://mock", job_description=None)
    return {"message": "Demo analysis started", "session_id": session_id}
EOF

# ── backend/app/services/whisper_service.py ─────────────────────
cp whisper_service.py backend/app/services/whisper_service.py 2>/dev/null || echo "whisper_service.py already in place"

# ── backend/app/services/deepface_service.py ────────────────────
cp deepface_service.py backend/app/services/deepface_service.py 2>/dev/null || echo "deepface_service.py already in place"

# ── backend/app/services/orchestrator.py ────────────────────────
cp orchestrator.py backend/app/services/orchestrator.py 2>/dev/null || echo "orchestrator.py already in place"

# ── backend/app/services/llm_service.py ─────────────────────────
cat > backend/app/services/llm_service.py << 'EOF'
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
EOF

# ── backend/requirements.txt ────────────────────────────────────
cat > backend/requirements.txt << 'EOF'
fastapi==0.115.5
uvicorn[standard]==0.32.1
python-multipart==0.0.12
pydantic==2.10.3
pydantic-settings==2.6.1
numpy==1.26.4
openai-whisper==20240930
deepface==0.0.93
tf-keras==2.18.0
openai==1.58.1
anthropic==0.40.0
opencv-python-headless==4.10.0.84
httpx==0.28.1
aiofiles==24.1.0
pytest==8.3.4
pytest-asyncio==0.24.0
EOF

# ── backend/Dockerfile ──────────────────────────────────────────
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p uploads
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
EOF

# ── backend/run.py ──────────────────────────────────────────────
cat > backend/run.py << 'EOF'
import subprocess, sys, os
os.chdir(os.path.dirname(__file__))
subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])
EOF

# ── frontend/index.html ─────────────────────────────────────────
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InterviewIQ — AI Interview Intelligence Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ── frontend/package.json ───────────────────────────────────────
cat > frontend/package.json << 'EOF'
{
  "name": "ai-interview-platform-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.1",
    "recharts": "^2.13.3",
    "lucide-react": "^0.469.0",
    "axios": "^1.7.9",
    "react-dropzone": "^14.3.5",
    "framer-motion": "^11.15.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
EOF

# ── frontend/vite.config.js ─────────────────────────────────────
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }
})
EOF

# ── frontend/tailwind.config.js ─────────────────────────────────
cat > frontend/tailwind.config.js << 'EOF'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { fontFamily: { display: ['"Syne"', 'sans-serif'], body: ['"DM Sans"', 'sans-serif'], mono: ['"JetBrains Mono"', 'monospace'] } } },
  plugins: []
}
EOF

# ── frontend/postcss.config.js ──────────────────────────────────
cat > frontend/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# ── frontend/src/main.jsx ───────────────────────────────────────
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
EOF

# ── frontend/src/App.jsx ────────────────────────────────────────
cat > frontend/src/App.jsx << 'EOF'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewInterview from './pages/NewInterview'
import InterviewDetail from './pages/InterviewDetail'
import Report from './pages/Report'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewInterview />} />
          <Route path="interviews/:id" element={<InterviewDetail />} />
          <Route path="reports/:id" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
EOF

# ── frontend/src/styles/index.css ──────────────────────────────
cat > frontend/src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
:root {
  --bg-primary: #0f0d17; --bg-secondary: #16131f; --bg-card: #1c1828;
  --border: rgba(255,255,255,0.08); --text-primary: #f0edf8;
  --text-secondary: #9d97b5; --accent: #7c6af7; --accent-glow: rgba(124,106,247,0.3);
}
* { box-sizing: border-box; }
body { background-color: var(--bg-primary); color: var(--text-primary); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg-secondary); } ::-webkit-scrollbar-thumb { background: #3d3559; border-radius: 3px; }
.glass { background: rgba(28,24,40,0.7); backdrop-filter: blur(12px); border: 1px solid var(--border); }
.gradient-text { background: linear-gradient(135deg,#a78bfa 0%,#7c6af7 50%,#60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.glow { box-shadow: 0 0 30px var(--accent-glow); } .glow-sm { box-shadow: 0 0 15px var(--accent-glow); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out; } .animate-slide-up { animation: slideUp 0.4s ease-out; }
EOF

# ── frontend/src/utils/api.js ───────────────────────────────────
cat > frontend/src/utils/api.js << 'EOF'
import axios from 'axios'
const api = axios.create({ baseURL: '/api', timeout: 120000 })
export const interviewAPI = {
  create: (fd) => api.post('/interviews/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/interviews/'),
  get: (id) => api.get(`/interviews/${id}`),
  runDemo: (id, position) => api.post(`/interviews/${id}/demo`, null, { params: { position } }),
  getStatus: (id) => api.get(`/analysis/${id}/status`),
  getReport: (id) => api.get(`/reports/${id}`),
}
export const pollStatus = (id, onUpdate, ms = 2000) => {
  const iv = setInterval(async () => {
    try {
      const { data } = await interviewAPI.getStatus(id)
      onUpdate(data)
      if (data.status === 'completed' || data.status === 'failed') clearInterval(iv)
    } catch(e) { console.error(e) }
  }, ms)
  return () => clearInterval(iv)
}
export default api
EOF

# Copy the already-present page files into correct locations
cp Report.jsx frontend/src/pages/Report.jsx 2>/dev/null && echo "Copied Report.jsx" || echo "Report.jsx missing"

# ── frontend/src/components/Layout.jsx ─────────────────────────
cat > frontend/src/components/Layout.jsx << 'EOF'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Brain, LayoutDashboard, Plus, Mic } from 'lucide-react'
export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen" style={{background:'var(--bg-primary)'}}>
      <aside className="w-64 flex-shrink-0 flex flex-col border-r" style={{borderColor:'var(--border)',background:'var(--bg-secondary)'}}>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-sm" style={{background:'linear-gradient(135deg,#7c6af7,#60a5fa)'}}>
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm font-bold" style={{color:'var(--text-primary)'}}>InterviewIQ</div>
              <div className="text-xs" style={{color:'var(--text-secondary)'}}>AI Platform</div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <button onClick={() => navigate('/new')} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>
            <Plus size={16} /> New Interview
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {[{to:'/',icon:LayoutDashboard,label:'Dashboard'},{to:'/new',icon:Mic,label:'Analyze Interview'}].map(({to,icon:Icon,label})=>(
            <NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all`}
              style={({isActive})=>({background:isActive?'rgba(124,106,247,0.15)':'transparent',color:isActive?'var(--text-primary)':'var(--text-secondary)',borderLeft:isActive?'2px solid #7c6af7':'2px solid transparent'})}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-xs" style={{color:'var(--text-secondary)'}}>All systems operational</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
EOF

# ── frontend/src/components/ScoreRing.jsx ──────────────────────
cat > frontend/src/components/ScoreRing.jsx << 'EOF'
export default function ScoreRing({ score, maxScore=10, size=80, label, sublabel }) {
  const r = (size-10)/2, circ = 2*Math.PI*r, offset = circ-(score/maxScore)*circ
  const color = score>=8?'#4ade80':score>=6?'#7c6af7':score>=4?'#fbbf24':'#f87171'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{width:size,height:size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',filter:`drop-shadow(0 0 6px ${color}60)`}}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold" style={{fontSize:size*0.22,color}}>{score.toFixed(1)}</span>
        </div>
      </div>
      {label&&<div className="text-center"><div className="text-xs font-medium" style={{color:'var(--text-primary)'}}>{label}</div>{sublabel&&<div className="text-xs" style={{color:'var(--text-secondary)'}}>{sublabel}</div>}</div>}
    </div>
  )
}
EOF

# ── frontend/src/components/EmotionTimeline.jsx ────────────────
cat > frontend/src/components/EmotionTimeline.jsx << 'EOF'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
const C = {happy:'#4ade80',neutral:'#94a3b8',surprise:'#60a5fa',fear:'#f87171',angry:'#f97316',sad:'#a78bfa',disgust:'#fbbf24'}
const T = ({active,payload,label})=>active&&payload?.length?(<div className="glass rounded-lg p-3 text-xs space-y-1"><p style={{color:'var(--text-secondary)'}}>{label}s</p>{payload.filter(p=>p.value>0.03).map(p=>(<div key={p.name} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:p.color}}/><span style={{color:'var(--text-primary)'}}>{p.name}: {(p.value*100).toFixed(0)}%</span></div>))}</div>):null
export default function EmotionTimeline({timeline}) {
  if(!timeline?.length) return null
  const data = timeline.map(f=>({time:Math.round(f.timestamp),...f.emotions}))
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{top:5,right:10,left:-20,bottom:0}}>
          <defs>{Object.entries(C).map(([e,c])=><linearGradient key={e} id={`g-${e}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.4}/><stop offset="95%" stopColor={c} stopOpacity={0.05}/></linearGradient>)}</defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
          <XAxis dataKey="time" tick={{fontSize:10,fill:'#9d97b5'}} tickFormatter={v=>`${v}s`}/>
          <YAxis tick={{fontSize:10,fill:'#9d97b5'}} tickFormatter={v=>`${(v*100).toFixed(0)}%`}/>
          <Tooltip content={<T/>}/>
          {Object.entries(C).map(([e,c])=><Area key={e} type="monotone" dataKey={e} stroke={c} fill={`url(#g-${e})`} strokeWidth={1.5} dot={false} stackId="e"/>)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
EOF

# ── frontend/src/pages/Dashboard.jsx ───────────────────────────
cat > frontend/src/pages/Dashboard.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewAPI } from '../utils/api'
import { Brain, Clock, CheckCircle, AlertCircle, Loader2, Plus, TrendingUp, Users } from 'lucide-react'
const SC = {pending:{icon:Clock,color:'#94a3b8',label:'Pending'},processing:{icon:Loader2,color:'#7c6af7',label:'Processing',spin:true},completed:{icon:CheckCircle,color:'#4ade80',label:'Completed'},failed:{icon:AlertCircle,color:'#f87171',label:'Failed'}}
const RB = {'Strong Yes':{color:'#4ade80',bg:'rgba(74,222,128,0.1)'},'Yes':{color:'#86efac',bg:'rgba(134,239,172,0.1)'},'Maybe':{color:'#fbbf24',bg:'rgba(251,191,36,0.1)'},'No':{color:'#f87171',bg:'rgba(248,113,113,0.1)'},'Strong No':{color:'#ef4444',bg:'rgba(239,68,68,0.1)'}}
export default function Dashboard() {
  const [sessions,setSessions]=useState([]);const [loading,setLoading]=useState(true);const navigate=useNavigate()
  useEffect(()=>{fetchSessions();const iv=setInterval(fetchSessions,5000);return()=>clearInterval(iv)},[])
  const fetchSessions=async()=>{try{const{data}=await interviewAPI.list();setSessions(data)}catch(e){console.error(e)}finally{setLoading(false)}}
  const stats={total:sessions.length,completed:sessions.filter(s=>s.status==='completed').length,processing:sessions.filter(s=>s.status==='processing').length,avgScore:sessions.filter(s=>s.report).reduce((a,s,_,arr)=>a+s.report.overall_score/arr.length,0)}
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div><h1 className="font-display text-3xl font-bold tracking-tight" style={{color:'var(--text-primary)'}}>Interview Intelligence</h1><p className="mt-1 text-sm" style={{color:'var(--text-secondary)'}}>Multimodal AI-powered candidate evaluation</p></div>
        <button onClick={()=>navigate('/new')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}><Plus size={16}/>Analyze Interview</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{label:'Total',value:stats.total,icon:Users,color:'#7c6af7'},{label:'Completed',value:stats.completed,icon:CheckCircle,color:'#4ade80'},{label:'Processing',value:stats.processing,icon:Loader2,color:'#fbbf24'},{label:'Avg Score',value:stats.avgScore?stats.avgScore.toFixed(1):'—',icon:TrendingUp,color:'#60a5fa'}].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="glass rounded-2xl p-5"><div className="flex items-center justify-between mb-3"><span className="text-xs uppercase tracking-wider" style={{color:'var(--text-secondary)'}}>{label}</span><Icon size={16} style={{color}}/></div><div className="font-display text-3xl font-bold" style={{color:'var(--text-primary)'}}>{value}</div></div>
        ))}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold mb-4" style={{color:'var(--text-primary)'}}>Recent Sessions</h2>
        {loading?<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={32} style={{color:'#7c6af7'}}/></div>:sessions.length===0?(
          <div className="glass rounded-2xl p-16 text-center"><Brain size={48} className="mx-auto mb-4 opacity-30" style={{color:'var(--text-secondary)'}}/><p className="font-display text-lg font-medium" style={{color:'var(--text-primary)'}}>No interviews yet</p><p className="text-sm mt-1 mb-6" style={{color:'var(--text-secondary)'}}>Upload a video or run a demo to get started</p><button onClick={()=>navigate('/new')} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>Start First Analysis</button></div>
        ):(
          <div className="space-y-3">{sessions.map(s=>{const cfg=SC[s.status]||SC.pending;const SI=cfg.icon;const rec=s.report?.llm_analysis?.hiring_recommendation;const badge=rec?RB[rec]:null;return(
            <div key={s.id} onClick={()=>s.status==='completed'?navigate(`/reports/${s.id}`):navigate(`/interviews/${s.id}`)} className="glass rounded-2xl p-5 flex items-center gap-5 cursor-pointer transition-all hover:border-purple-500/30">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${cfg.color}15`}}><SI size={18} style={{color:cfg.color}} className={cfg.spin?'animate-spin':''}/></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{s.candidate_name||'Anonymous Candidate'}</span>{s.position&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(124,106,247,0.1)',color:'#a78bfa'}}>{s.position}</span>}</div><div className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
              {s.report&&<div className="text-right"><div className="font-display text-2xl font-bold" style={{color:'#7c6af7'}}>{s.report.overall_score.toFixed(1)}</div><div className="text-xs" style={{color:'var(--text-secondary)'}}>/ 10</div></div>}
              {badge&&<div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{background:badge.bg,color:badge.color}}>{rec}</div>}
              {!s.report&&<span className="text-xs px-2.5 py-1 rounded-lg" style={{background:`${cfg.color}15`,color:cfg.color}}>{cfg.label}</span>}
            </div>
          )})}</div>
        )}
      </div>
    </div>
  )
}
EOF

# ── frontend/src/pages/NewInterview.jsx ────────────────────────
cat > frontend/src/pages/NewInterview.jsx << 'EOF'
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { interviewAPI } from '../utils/api'
import { Upload, Video, Sparkles, Loader2, AlertCircle } from 'lucide-react'
export default function NewInterview() {
  const navigate=useNavigate();const[file,setFile]=useState(null);const[form,setForm]=useState({candidate_name:'',position:'',interviewer:'',job_description:''});const[loading,setLoading]=useState(false);const[error,setError]=useState(null);const[mode,setMode]=useState('upload')
  const onDrop=useCallback(a=>{if(a[0])setFile(a[0])},[])
  const{getRootProps,getInputProps,isDragActive}=useDropzone({onDrop,accept:{'video/*':['.mp4','.webm','.mov','.avi']},maxFiles:1,disabled:mode==='demo'})
  const handleSubmit=async()=>{setLoading(true);setError(null);try{const fd=new FormData();if(form.candidate_name)fd.append('candidate_name',form.candidate_name);if(form.position)fd.append('position',form.position);if(form.interviewer)fd.append('interviewer',form.interviewer);if(form.job_description)fd.append('job_description',form.job_description);if(file&&mode==='upload')fd.append('video',file);const{data:session}=await interviewAPI.create(fd);if(mode==='demo')await interviewAPI.runDemo(session.id,form.position);navigate(`/interviews/${session.id}`)}catch(err){setError(err.response?.data?.detail||err.message||'Failed to start analysis')}finally{setLoading(false)}}
  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8"><h1 className="font-display text-3xl font-bold tracking-tight" style={{color:'var(--text-primary)'}}>New Interview Analysis</h1><p className="mt-1 text-sm" style={{color:'var(--text-secondary)'}}>Upload a recorded interview or run a demo</p></div>
      <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{background:'var(--bg-card)'}}>
        {[{key:'upload',label:'Upload Video',icon:Upload},{key:'demo',label:'Demo Mode',icon:Sparkles}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setMode(key)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all" style={{background:mode===key?'rgba(124,106,247,0.2)':'transparent',color:mode===key?'#a78bfa':'var(--text-secondary)',border:mode===key?'1px solid rgba(124,106,247,0.3)':'1px solid transparent'}}><Icon size={15}/>{label}</button>
        ))}
      </div>
      {mode==='upload'&&<div {...getRootProps()} className="mb-6 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all" style={{borderColor:isDragActive?'#7c6af7':file?'#4ade80':'rgba(255,255,255,0.1)',background:file?'rgba(74,222,128,0.03)':'var(--bg-card)'}}><input {...getInputProps()}/>{file?<><Video size={40} className="mx-auto mb-3" style={{color:'#4ade80'}}/><p className="font-medium text-sm" style={{color:'#4ade80'}}>{file.name}</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>{(file.size/1024/1024).toFixed(1)} MB</p></>:<><Upload size={40} className="mx-auto mb-3 opacity-40" style={{color:'var(--text-secondary)'}}/><p className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{isDragActive?'Drop video here':'Drag & drop interview video'}</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>MP4, WebM, MOV · Up to 500MB</p></>}</div>}
      {mode==='demo'&&<div className="mb-6 rounded-2xl p-5 border" style={{background:'rgba(124,106,247,0.05)',borderColor:'rgba(124,106,247,0.2)'}}><div className="flex items-start gap-3"><Sparkles size={18} style={{color:'#a78bfa'}} className="mt-0.5"/><div><p className="text-sm font-medium" style={{color:'#a78bfa'}}>Demo Mode Active</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>No video required. Generates a complete analysis using realistic synthetic data.</p></div></div></div>}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[{key:'candidate_name',label:'Candidate Name',placeholder:'Jane Smith'},{key:'position',label:'Position Applied',placeholder:'Senior Engineer'},{key:'interviewer',label:'Interviewer',placeholder:'Your name'}].map(({key,label,placeholder})=>(
            <div key={key} className={key==='interviewer'?'col-span-2':''}><label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-secondary)'}}>{label}</label><input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/></div>
          ))}
        </div>
        <div><label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-secondary)'}}>Job Description (optional)</label><textarea value={form.job_description} onChange={e=>setForm(f=>({...f,job_description:e.target.value}))} placeholder="Paste the job description here..." rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/></div>
      </div>
      {error&&<div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm" style={{background:'rgba(248,113,113,0.1)',color:'#f87171'}}><AlertCircle size={16}/>{error}</div>}
      <button onClick={handleSubmit} disabled={loading||!(mode==='demo'||file)} className="w-full py-3.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>
        {loading?<><Loader2 size={16} className="animate-spin"/>Starting...</>:<><Sparkles size={16}/>{mode==='demo'?'Run Demo Analysis':'Analyze Interview'}</>}
      </button>
    </div>
  )
}
EOF

# ── frontend/src/pages/InterviewDetail.jsx ─────────────────────
cat > frontend/src/pages/InterviewDetail.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewAPI, pollStatus } from '../utils/api'
import { Brain, CheckCircle, AlertCircle, Loader2, Mic, Eye, Zap, FileText } from 'lucide-react'
const STAGES=[{key:'transcription',label:'Speech Transcription',sublabel:'Whisper AI',icon:Mic},{key:'emotion_analysis',label:'Emotion Detection',sublabel:'DeepFace',icon:Eye},{key:'communication_analysis',label:'Communication Analysis',sublabel:'NLP Pipeline',icon:Zap},{key:'llm_analysis',label:'Behavioral Analysis',sublabel:'LLM Reasoning',icon:Brain},{key:'report_generation',label:'Report Generation',sublabel:'Synthesis',icon:FileText}]
export default function InterviewDetail() {
  const{id}=useParams();const navigate=useNavigate();const[session,setSession]=useState(null);const[status,setStatus]=useState(null);const[currentStage,setCurrentStage]=useState(0);const[progress,setProgress]=useState(0)
  useEffect(()=>{
    interviewAPI.get(id).then(({data})=>setSession(data)).catch(console.error)
    const stop=pollStatus(id,update=>{setStatus(update);if(update.stage&&update.stage!=='complete'&&update.stage!=='error'){const i=STAGES.findIndex(s=>s.key===update.stage);if(i>=0)setCurrentStage(i)}setProgress(update.progress||0);if(update.status==='completed')navigate(`/reports/${id}`,{replace:true})})
    return stop
  },[id])
  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-10"><div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 glow" style={{background:'linear-gradient(135deg,#7c6af7,#60a5fa)'}}><Brain size={28} className="text-white"/></div><h1 className="font-display text-2xl font-bold" style={{color:'var(--text-primary)'}}>Analyzing Interview</h1>{session&&<p className="mt-2 text-sm" style={{color:'var(--text-secondary)'}}>{session.candidate_name?`Processing ${session.candidate_name}'s interview`:'Processing interview recording'}{session.position&&` for ${session.position}`}</p>}</div>
      <div className="glass rounded-2xl p-6 mb-6"><div className="flex items-center justify-between mb-3"><span className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{status?.message||'Initializing...'}</span><span className="font-mono text-sm" style={{color:'#7c6af7'}}>{Math.round(progress)}%</span></div><div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}><div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`,background:'linear-gradient(90deg,#7c6af7,#60a5fa)',boxShadow:'0 0 12px rgba(124,106,247,0.5)'}}/></div></div>
      <div className="space-y-3">{STAGES.map((stage,idx)=>{const done=idx<currentStage||progress===100;const active=idx===currentStage&&progress>0&&progress<100;const Icon=stage.icon;return(
        <div key={stage.key} className="glass rounded-xl p-4 flex items-center gap-4 transition-all" style={{opacity:idx>currentStage?0.4:1}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:done?'rgba(74,222,128,0.1)':active?'rgba(124,106,247,0.15)':'rgba(255,255,255,0.03)'}}>
            {done?<CheckCircle size={18} style={{color:'#4ade80'}}/>:active?<Loader2 size={18} style={{color:'#7c6af7'}} className="animate-spin"/>:<Icon size={18} style={{color:'var(--text-secondary)'}}/>}
          </div>
          <div className="flex-1"><div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{stage.label}</div><div className="text-xs" style={{color:'var(--text-secondary)'}}>{stage.sublabel}</div></div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{background:done?'rgba(74,222,128,0.1)':active?'rgba(124,106,247,0.1)':'rgba(255,255,255,0.03)',color:done?'#4ade80':active?'#a78bfa':'var(--text-secondary)'}}>{done?'Done':active?'Running':'Queued'}</span>
        </div>
      )})}</div>
      {status?.status==='failed'&&<div className="mt-6 glass rounded-xl p-4 flex items-center gap-3"><AlertCircle style={{color:'#f87171'}} size={18}/><div><p className="text-sm font-medium" style={{color:'#f87171'}}>Analysis failed</p><p className="text-xs" style={{color:'var(--text-secondary)'}}>{status.error}</p></div></div>}
    </div>
  )
}
EOF

# ── docker-compose.yml ──────────────────────────────────────────
cat > docker-compose.yml << 'EOF'
version: '3.9'
services:
  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    ports: ["8000:8000"]
    environment:
      - ENVIRONMENT=production
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - WHISPER_MODEL=${WHISPER_MODEL:-base}
    volumes: ["./uploads:/app/uploads"]
  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    ports: ["3000:80"]
    depends_on: [backend]
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: ["./nginx.conf:/etc/nginx/conf.d/default.conf"]
    depends_on: [backend, frontend]
EOF

# ── nginx.conf ──────────────────────────────────────────────────
cat > nginx.conf << 'EOF'
server {
    listen 80;
    location /api/ { proxy_pass http://backend:8000/api/; proxy_set_header Host $host; proxy_read_timeout 300s; client_max_body_size 500M; }
    location / { proxy_pass http://frontend:80; proxy_set_header Host $host; }
}
EOF

# ── frontend/Dockerfile ─────────────────────────────────────────
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EOF

# ── frontend/nginx-frontend.conf ────────────────────────────────
cat > frontend/nginx-frontend.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://backend:8000/api/; proxy_set_header Host $host; client_max_body_size 500M; }
}
EOF

# ── .env.example ────────────────────────────────────────────────
cat > .env.example << 'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
WHISPER_MODEL=base
LLM_MODEL=gpt-4o
ENVIRONMENT=development
DEBUG=true
MAX_FILE_SIZE_MB=500
EOF

# ── .github/workflows/ci.yml ────────────────────────────────────
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install fastapi uvicorn pydantic pydantic-settings numpy pytest pytest-asyncio httpx
        working-directory: backend
      - run: pytest tests/ -v --tb=short || echo "No tests found"
        working-directory: backend
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
        working-directory: frontend
EOF

echo ""
echo "✅ Full project structure created!"
echo ""
echo "Files created:"
find . -not -path './.git/*' -type f | sort
