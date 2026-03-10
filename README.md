# 🧠 AI Interview Intelligence Platform

A production-grade multimodal interview evaluation system that analyzes candidate interviews using **Whisper** (speech-to-text), **DeepFace** (facial emotion detection), and **LLM reasoning** to generate structured behavioral assessment reports.

![Platform Preview](docs/preview.png)

---

## ✨ Features

| Module | Technology | Capability |
|--------|-----------|------------|
| Speech Analysis | OpenAI Whisper | Transcription, WPM, filler detection, timestamps |
| Emotion Detection | DeepFace | Per-frame emotion classification, stability scoring |
| NLP Pipeline | Rule-based + LLM | Clarity, coherence, vocabulary richness |
| LLM Analysis | GPT-4o / Claude | Strengths, red flags, hiring recommendation |
| Report Generation | FastAPI + React | Interactive scored report with visualizations |

### Analysis Pipeline

```
Video Upload → Audio Extraction (ffmpeg)
                      ↓
              Whisper STT → Transcript + WPM
                      ↓
           DeepFace → Emotion Timeline
                      ↓
         Communication Metrics (NLP)
                      ↓
    LLM Analysis (GPT-4o / Claude / Fallback)
                      ↓
         📊 Candidate Evaluation Report
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/ai-interview-platform.git
cd ai-interview-platform

cp .env.example .env
# Edit .env with your API keys (optional — works without them in demo mode)

docker compose up --build
```

Open: http://localhost:80

### Option 2: Local Development

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Install system dependencies
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg libgl1-mesa-glx

cp ../.env.example .env
python run.py
# → http://localhost:8000
# → Docs: http://localhost:8000/api/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 🎮 Demo Mode

No video file needed! Use **Demo Mode** in the UI to:
- Run the full analysis pipeline with synthetic interview data
- See a complete evaluation report with emotion timeline, radar chart, and LLM analysis
- Test all features without API keys (rule-based fallback analysis)

---

## 🏗️ Architecture

```
ai-interview-platform/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   │   ├── interviews.py   # Upload, create, list sessions
│   │   │   ├── analysis.py     # Status polling
│   │   │   └── reports.py      # Report retrieval
│   │   ├── core/
│   │   │   └── config.py       # Pydantic settings
│   │   ├── models/
│   │   │   └── schemas.py      # All Pydantic models
│   │   └── services/
│   │       ├── whisper_service.py    # STT pipeline
│   │       ├── deepface_service.py   # Emotion analysis
│   │       ├── llm_service.py        # LLM reasoning
│   │       └── orchestrator.py       # Pipeline coordinator
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # ScoreRing, EmotionTimeline, Layout
│   │   ├── pages/            # Dashboard, NewInterview, Report
│   │   └── utils/            # API client, polling
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/ci.yml
```

---

## 📊 Evaluation Dimensions

**Communication**
- Clarity Score (0–10)
- Confidence Score (0–10)
- Coherence Score (0–10)
- Vocabulary Richness (0–10)
- Words Per Minute
- Filler Word Ratio

**Emotional Intelligence**
- Dominant Emotion Classification
- Emotional Stability Score
- Engagement Score
- Stress Indicator Detection
- Per-frame Emotion Timeline

**Behavioral Signals**
- Eye Contact Score
- Posture Assessment
- Gesture Frequency
- Attentiveness Score
- Authenticity Score

**LLM Reasoning**
- Overall Assessment Narrative
- Top Strengths (evidence-backed)
- Areas for Improvement
- Culture Fit Indicators
- Red Flag Detection
- Hiring Recommendation (Strong Yes → Strong No)

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI key for GPT-4o analysis |
| `ANTHROPIC_API_KEY` | — | Anthropic key for Claude analysis |
| `WHISPER_MODEL` | `base` | Whisper model size (tiny/base/small/medium/large) |
| `LLM_MODEL` | `gpt-4o` | LLM model for analysis |
| `MAX_FILE_SIZE_MB` | `500` | Max video upload size |
| `FRAME_SAMPLE_RATE` | `5` | Sample every N seconds for emotion detection |

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/interviews/` | POST | Create session + upload video |
| `/api/interviews/` | GET | List all sessions |
| `/api/interviews/{id}` | GET | Get session details |
| `/api/interviews/{id}/demo` | POST | Run demo analysis |
| `/api/analysis/{id}/status` | GET | Poll analysis progress |
| `/api/reports/{id}` | GET | Get evaluation report |

Interactive docs: `http://localhost:8000/api/docs`

---

## 🚢 Production Deployment

### Render / Railway / Fly.io

1. Fork this repository
2. Connect your GitHub to the platform
3. Set environment variables
4. Deploy — Dockerfiles are included

### Manual VPS

```bash
git clone https://github.com/YOUR_USERNAME/ai-interview-platform
cd ai-interview-platform
cp .env.example .env && nano .env  # Add API keys
docker compose up -d
```

---

## 🧪 Extending the Platform

**Add a new analysis dimension:**
1. Add fields to `CandidateReport` in `schemas.py`
2. Add analysis logic in `llm_service.py`
3. Call it in `orchestrator.py`
4. Display it in `frontend/src/pages/Report.jsx`

**Swap Whisper for OpenAI API:**
In `whisper_service.py`, replace `_transcribe_local` with an OpenAI Whisper API call.

**Add database persistence:**
Replace the in-memory `sessions` dict in `orchestrator.py` with SQLAlchemy + PostgreSQL.

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) — speech recognition
- [DeepFace](https://github.com/serengil/deepface) — facial emotion analysis
- [FastAPI](https://fastapi.tiangolo.com/) — backend framework
- [Recharts](https://recharts.org/) — React charting
