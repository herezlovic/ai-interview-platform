# Clarion — Interview Intelligence

Multimodal interview evaluation: **speech (Whisper)** → **emotion (DeepFace)** → **metrics** → **LLM judgment** → interactive report.

Brand site + app UI are production-styled. **Demo Mode always works** (no API keys, no video, no GPU). Upload + real models are optional when configured.

---

## Live demo

| Surface | URL |
|---------|-----|
| GitHub Pages (browser demo) | Enabled via Actions on `main` → `https://herezlovic.github.io/ai-interview-platform/` |
| Full API + SPA (Docker / Render / Fly) | See [Deploy](#-deploy) |

On GitHub Pages the app runs in **local demo mode** (pipeline simulated in the browser with a full report). With Docker/Render it hits the real FastAPI backend (still demo-ready without ML weights).

---

## Quick start

### One-container demo (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Open **http://localhost:8000** → **Run live demo**.

### Local development

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
python run.py
# http://localhost:8000/api/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

---

## Product flow

```
Landing → New analysis (Demo or Upload)
        → Live stage progress
        → Candidate report (scores, radar, emotion timeline, LLM narrative)
```

### Analysis pipeline

```
Video / Demo
   → Whisper STT (or mock)
   → DeepFace emotion timeline (or mock)
   → Communication metrics
   → LLM analysis (OpenAI / Anthropic / mock)
   → Clarion report
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + provider status |
| POST | `/api/interviews/` | Create session (+ optional video) |
| GET | `/api/interviews/` | List sessions |
| GET | `/api/interviews/{id}` | Session detail |
| DELETE | `/api/interviews/{id}` | Delete session |
| POST | `/api/interviews/{id}/demo` | Start demo analysis |
| GET | `/api/analysis/{id}/status` | Progress (`stage`, `progress`, `message`) |
| GET | `/api/reports/{id}` | Full report |

Interactive docs: `/api/docs`

---

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `OPENAI_API_KEY` | — | Enables real GPT analysis (+ optional Whisper API) |
| `ANTHROPIC_API_KEY` | — | Claude analysis fallback |
| `WHISPER_PROVIDER` | `mock` | `mock` \| `local` \| `openai` \| `auto` |
| `LLM_MODEL` | `gpt-4o` | OpenAI model id |
| `MAX_FILE_SIZE_MB` | `500` | Upload cap |
| `ALLOWED_ORIGINS` | localhost | Comma-separated CORS list |

Optional local ML (not in default image):

```bash
pip install openai-whisper deepface tf-keras opencv-python-headless
# set WHISPER_PROVIDER=local
```

---

## Deploy

### Render (Docker free tier)

Step-by-step: **[`docs/RENDER.md`](docs/RENDER.md)**

Short version:

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect GitHub repo `herezlovic/ai-interview-platform`
3. Branch: `main` (or the PR branch until merged) · Blueprint: `render.yaml`
4. Deploy → open `https://clarion-….onrender.com` → **Run live demo**
5. Optional: set `OPENAI_API_KEY` in the service Environment tab

### Fly.io

```bash
fly launch --config fly.toml
fly deploy
```

### GitHub Pages (always-on UI demo)

Push to `main`. Workflow `.github/workflows/pages.yml` builds the SPA with `VITE_FORCE_LOCAL=true` and deploys Pages.

Enable in repo **Settings → Pages → Source: GitHub Actions**.

---

## Architecture

```
ai-interview-platform/
├── backend/app/          # FastAPI + services + JSON session store
├── frontend/src/         # React (Vite) — Clarion UI
├── Dockerfile            # SPA build + API in one image
├── docker-compose.yml
├── render.yaml
├── fly.toml
└── docs/E2E_BUILD_PLAN.md
```

Sessions persist to `data/sessions.json` on a single instance (fine for demos). Replace with Postgres for multi-instance production.

---

## License

MIT — see [LICENSE](LICENSE).
