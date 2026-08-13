# End-to-End Platform Build Plan

**Product:** AI Interview Intelligence Platform  
**Repo state:** Demo/MVP scaffold (UI + API wired; persistence, real LLM, reliable demo, and production ops incomplete)  
**Goal:** Ship a working multimodal interview evaluation system: upload/demo → Whisper STT → DeepFace emotion → metrics → LLM reasoning → interactive report — reliably locally and in Docker, then harden for production.

---

## Current baseline (what exists today)

| Layer | Present | Gaps that block “E2E working” |
|-------|---------|--------------------------------|
| FastAPI API surface | Health, interviews, analysis status, reports | Status omits `stage` / `progress` / `message`; no delete; no auth |
| Orchestrator | Full pipeline stages in-memory | Demo path always hits ffmpeg; progress callbacks unused; multi-worker unsafe |
| Whisper / DeepFace | Real code + mock fallbacks | Demo not branched; heavy ML image; no job queue |
| LLM | Client init scaffolding | Always returns mock; ignores keys / JD / position |
| Frontend | Dashboard, upload, processing, report | Progress stuck at 0%; incomplete report fields; no lockfile |
| Infra | Compose + nginx + CI skeleton | No DB/Redis; CI `npm ci` fails without lockfile; no real tests |
| Repo hygiene | Bootstrap leftovers at root | Duplicate `orchestrator.py`, `whisper_service.py`, `deepface_service.py`, `Report.jsx`, `setup_project.sh` |

**Definition of done (E2E):** A new user can open the app, run **Demo Mode** or upload a short video, watch real stage progress, and view a complete scored report — both with and without API keys (mock LLM fallback when keys missing).

---

## Architecture target

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│  React SPA  │────▶│  FastAPI API │────▶│  Postgres (sessions,    │
│  (Vite)     │◀────│  (thin)      │     │   reports, progress)    │
└─────────────┘     └──────┬───────┘     └─────────────────────────┘
                           │ enqueue
                           ▼
                    ┌──────────────┐     ┌─────────────────────────┐
                    │ Redis +      │────▶│ Worker (Whisper,        │
                    │ job queue    │     │  DeepFace, LLM, ffmpeg) │
                    └──────────────┘     └─────────────────────────┘
                           │
                           ▼
                    Object storage / volume (videos, audio, artifacts)
```

Keep API and ML worker as **separate images** once Phase 2 starts so API pods stay light.

---

## Phase 0 — Unblock the demo (foundation)

**Outcome:** Demo Mode and status polling work in Docker with workers=1.

1. **Demo path branch** in orchestrator / Whisper / DeepFace  
   - Detect `demo://` (or `session.is_demo`) and skip ffmpeg / `VideoCapture`.  
   - Force mock transcript + emotion timeline for demo; keep real pipeline for uploads.

2. **Progress API**  
   - Persist `stage`, `progress` (0–100), `message` on the session.  
   - Wire orchestrator callbacks to update them.  
   - Extend `GET /api/analysis/{id}/status` to return those fields (frontend already expects them).

3. **Process safety**  
   - Set Uvicorn `--workers 1` until shared store exists.  
   - Null-safe `content_type` / extension validation on upload.

4. **Repo hygiene**  
   - Delete root duplicates; keep `backend/app/services/*` and `frontend/src/pages/Report.jsx` as source of truth.  
   - Add `.gitignore` (`uploads/`, `venv/`, `node_modules/`, `.env`, `__pycache__`, etc.).  
   - Commit `frontend/package-lock.json`; fix CI to run a real smoke test (or `npm install` interim).

5. **Smoke acceptance**  
   - `docker compose up --build` → Demo Mode → report renders.  
   - Local frontend + backend without ML deps still completes via mocks.

**Exit criteria:** Demo E2E green; processing page shows stage progression; CI installs frontend cleanly.

---

## Phase 1 — Durable MVP

**Outcome:** Restarts and multi-request flows don’t lose sessions; LLM is real when keys exist.

1. **Persistence**  
   - PostgreSQL + SQLAlchemy (or equivalent) for sessions, status, reports.  
   - Alembic migrations.  
   - Replace in-memory `sessions` dict in orchestrator.

2. **Media storage**  
   - Durable volume (Compose) or S3-compatible bucket.  
   - Retention/cleanup job for failed/old uploads.

3. **Real LLM path**  
   - In `llm_service.generate_llm_analysis`, call OpenAI / Anthropic when `_provider` is set.  
   - Structured JSON schema / parse with fallback to mock on failure.  
   - Pass `position` and `job_description` into the prompt.  
   - Keep mock path when keys are absent (documented demo behavior).

4. **Health & config**  
   - Health endpoint reports Whisper / DeepFace / LLM readiness.  
   - Expand `.env.example` (`FRAME_SAMPLE_RATE`, DB URL, Redis URL placeholders).

5. **Frontend report completeness**  
   - Surface `red_flags`, `culture_fit_indicators`, full behavioral section, optional technical score.  
   - Use `framer-motion` intentionally (or remove unused dep).

**Exit criteria:** Restart backend mid-session → status/report still recoverable; with `OPENAI_API_KEY` set, report narrative is model-generated.

---

## Phase 2 — Production processing

**Outcome:** Long videos don’t block API; scale and ops are credible.

1. **Job queue**  
   - Redis + Celery / RQ / Arq.  
   - API enqueues analysis; worker runs Whisper → DeepFace → metrics → LLM.  
   - Progress updates via DB (and optionally WebSocket/SSE).

2. **Split images**  
   - `backend-api`: FastAPI only.  
   - `backend-worker`: ffmpeg + Whisper + DeepFace + LLM client.  
   - Optional: Whisper API / cloud STT to shrink worker image.

3. **Auth & tenancy**  
   - JWT or OIDC (or API keys for B2B).  
   - Sessions scoped to user/org; stop public `list all interviews`.

4. **Hardening**  
   - Rate limits, max concurrent analyses, upload size/MIME allowlist.  
   - Structured logging, request IDs, basic metrics.  
   - Compose/K8s healthchecks; nginx timeouts aligned with job model (not sync ML).

5. **Security / privacy**  
   - Consent copy for biometric emotion analysis.  
   - Retention policy; delete endpoint that removes DB rows + media.

**Exit criteria:** Upload a multi-minute video; API stays responsive; worker completes; auth required for list/get/report.

---

## Phase 3 — Product completeness

**Outcome:** README claims match product behavior; release-ready.

1. **Product features**  
   - Delete/archive interviews; PDF/CSV export; candidate comparison.  
   - Speaker diarization only if multi-party interviews are in scope.  
   - Either implement real gaze/pose models or **narrow README claims** for eye contact / posture / gestures.

2. **Quality**  
   - Backend: unit tests for metrics + orchestrator with mocks; API integration tests for demo + upload happy path.  
   - Frontend: build in CI; Playwright/Cypress smoke for Demo → Report.  
   - Scoring validity notes in docs (heuristic vs measured).

3. **Release polish**  
   - `LICENSE` (MIT), accurate README, architecture diagram, `docs/preview` asset or remove claim.  
   - Deploy recipe (Render/Fly/Railway or VPS) with secrets, TLS, backups.

**Exit criteria:** CI green with real tests; deploy docs verified once; marketing language matches implementation.

---

## Recommended workstream order (implementation slices)

Execute as vertical slices, not big-bang rewrites:

| Slice | Scope | Unlocks |
|-------|--------|---------|
| S0 | Demo branch + progress API + workers=1 + hygiene | Trustworthy local/Docker demo |
| S1 | package-lock + CI smoke + minimal pytest for `/health` + demo status shape | Regression safety |
| S2 | Postgres session/report store | Multi-worker readiness |
| S3 | Real LLM + JD/position in prompt | Differentiated product value |
| S4 | Redis queue + worker split | Production video path |
| S5 | Auth + delete + retention | Multi-user / compliance baseline |
| S6 | Report UI gaps + export + docs/LICENSE | Ship narrative |

---

## Key technical decisions (decide once, then build)

1. **STT:** Keep local Whisper for MVP; add OpenAI Whisper API as optional provider behind config (`WHISPER_PROVIDER=local|openai`) to ease deploy cost.  
2. **Emotion:** Keep DeepFace with frame sampling; document CPU cost; sample rate via `FRAME_SAMPLE_RATE`.  
3. **LLM:** Prefer structured output (JSON mode / tool schema); always validate into `LLMAnalysis`.  
4. **Behavioral scores:** Phase 0–2 treat as emotion-derived heuristics; Phase 3 either upgrade CV or reword product copy.  
5. **State:** No horizontal API scale until Postgres (and preferably Redis) is in place.

---

## Testing strategy per phase

| Phase | Minimum tests |
|-------|----------------|
| 0 | Manual Docker demo; unit: status payload includes progress fields |
| 1 | Integration: create demo → poll → get report against Postgres |
| 2 | Worker job completes with mocked ML; API returns 202/queued semantics if introduced |
| 3 | E2E browser smoke; auth negative tests; delete removes artifacts |

---

## Out of scope (until later)

- Mobile native apps  
- Live interview streaming / real-time coaching  
- Full ATS integrations (Greenhouse, Lever)  
- Fine-tuned domain models for hiring fairness auditing (should be a dedicated workstream if required)

---

## Immediate next actions

1. Implement **Phase 0** on a feature branch (`demo path`, `progress status`, `workers=1`, delete orphans, lockfile).  
2. Open PR with Demo Mode screencast / curl transcript of status polling.  
3. Only then start Phase 1 persistence + real LLM.

This sequence turns the current scaffold into a trustworthy E2E platform first, then into a production system — without rewriting the React/FastAPI surface that already matches the intended product shape.
