# End-to-End Platform Build Plan

**Status (updated):** Phase 0–1 demo path is implemented in-app. Clarion UI rewrite shipped. Demo Mode works locally and via browser-local fallback for GitHub Pages. Remaining: enable Pages in repo settings; optional Render/Fly for always-on API container.

See the root [README](../README.md) for current architecture and deploy steps.

## Shipped

- Working demo pipeline (no ffmpeg on `demo://`)
- Progress fields on analysis status API
- JSON session persistence (`data/sessions.json`)
- Real OpenAI/Anthropic LLM path with mock fallback
- Clarion React UI (landing + app + report)
- Single Dockerfile (SPA + FastAPI)
- CI tests + GitHub Pages workflow
- `render.yaml` / `fly.toml`

## Still open for production scale

- Postgres + Redis job queue
- Auth / multi-tenant isolation
- Split API vs ML worker images
- Real gaze/pose models (or keep heuristic labeling)
