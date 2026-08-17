# Deploy Clarion on Render

Clarion ships as **one Docker web service** (React SPA + FastAPI). Demo Mode works with no API keys.

## Option A — Dashboard Blueprint (recommended, ~5 minutes)

1. Sign up / log in: [dashboard.render.com](https://dashboard.render.com)
2. Connect GitHub: **Account Settings → Connected Accounts → GitHub** (grant access to `herezlovic/ai-interview-platform`)
3. Open **New → Blueprint**
4. Select **`herezlovic/ai-interview-platform`**
5. Set:
   - **Branch:** `main` (after merge) **or** `cursor/e2e-platform-build-plan-3a73` (current PR branch)
   - **Blueprint Path:** `render.yaml`
6. Click **Apply** / **Deploy Blueprint**
7. Wait for the first Docker build (can take several minutes)
8. Open the service URL: `https://clarion-XXXX.onrender.com`

### Optional env vars (service → Environment)

| Key | Needed? | Notes |
|-----|---------|-------|
| `OPENAI_API_KEY` | Optional | Live GPT analysis instead of mock |
| `ANTHROPIC_API_KEY` | Optional | Claude fallback |
| `WHISPER_PROVIDER` | Default `mock` | Keep `mock` on free tier |

### Verify

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
# → {"status":"ok","demo_ready":true,...}
```

Then in the browser: **Run live demo** → progress → report.

---

## Option B — Manual Web Service (same result)

1. **New → Web Service** → connect the repo  
2. Settings:
   - **Language / Runtime:** Docker  
   - **Dockerfile Path:** `./Dockerfile`  
   - **Branch:** as above  
   - **Instance type:** Free  
   - **Health Check Path:** `/api/health`  
3. Environment (same as Blueprint)  
4. **Create Web Service**

---

## Free-tier notes

- Service **spins down** after idle ~15 minutes; first request after that can take ~30–60s (cold start).
- No persistent disk on free → session JSON resets on redeploy/restart (Demo Mode still works).
- Docker image builds from the repo root `Dockerfile` (Node build stage + Python API).

---

## After merge

Point the Render service branch to **`main`** so production tracks the default branch.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Deploy fails “no open ports” | Ensure latest `Dockerfile` binds to `$PORT` (already fixed in this branch) |
| Health check failing | Path must be `/api/health`; wait for cold start |
| Blank UI / 404 on refresh | SPA is served by FastAPI `STATIC_DIR=static` — confirm Docker build copied `frontend/dist` |
| Build OOM | Stay on lite requirements (no Whisper/DeepFace in default image) |
