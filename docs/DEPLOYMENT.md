# Deployment Guide — AI Learning Conductor

**Version**: 1.0  
**Last Updated**: September 2026

---

## Architecture

```
Frontend (React/Vite)              Backend (FastAPI)              AI
     ↓                                    ↓                        ↓
Vercel / Static Host  ──REST──►  Render / Railway / Fly.io  ──►  Gemini API
     ↓                                    ↓
IndexedDB (offline)          SQLite (dev) / PostgreSQL (prod)
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Git

### 1. Clone & Configure

```bash
git clone <repo-url>
cd "AI for Foundational Learning Hackathon"

# Configure backend environment
cp .env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY (optional — system works without it)

# Configure frontend environment
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local if needed (defaults work for local dev)
```

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`  
Health: `http://localhost:8000/health`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

---

## Docker Development (Local Production-Like)

```bash
# Build and run with Docker Compose
GEMINI_API_KEY=your_key_here docker-compose up --build

# Or without AI (deterministic fallback active)
docker-compose up --build
```

---

## Production Deployment

### Backend (Render / Railway / Fly.io)

1. Push code to GitHub repository
2. Create a new Web Service on your platform
3. Set root directory to `backend/`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Set environment variables (see Environment Variables section below)

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variables (see below)

---

## Environment Variables

### Backend (Required)

| Variable | Description | Default |
|---|---|---|
| `ENVIRONMENT` | `development` or `production` | `development` |
| `DEMO_MODE` | `true` loads demo data, `false` starts empty | `true` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

### Backend (Optional)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (leave empty for deterministic-only mode) |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.5-flash`) |
| `DATABASE_URL` | Database connection (default: SQLite at `./data/ai_learning_conductor.db`) |
| `AI_TIMEOUT_SECONDS` | Gemini API timeout (default: `12`) |
| `LOG_LEVEL` | Logging level (default: `INFO`) |

### Frontend

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend URL (empty = use Vite proxy) | empty |
| `VITE_DEMO_MODE` | Show demo mode banner | `true` |

---

## CORS Configuration

**Development**: CORS is permissive (localhost origins only).

**Production**: Set `CORS_ORIGINS` to your exact frontend domain:
```
CORS_ORIGINS=https://your-school-platform.edu.in
```

Multiple origins: comma-separated.
```
CORS_ORIGINS=https://school.edu.in,https://www.school.edu.in
```

Never use `*` in production.

---

## Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Generate an API key
3. Set `GEMINI_API_KEY` in your backend environment
4. **Never commit this key**

The system functions without a Gemini key — all AI features fall back to deterministic heuristics.

---

## Demo Mode vs Production Mode

| Setting | Demo Mode (`DEMO_MODE=true`) | Production Mode (`DEMO_MODE=false`) |
|---|---|---|
| Data on startup | 30 pre-seeded students loaded | Empty — real records only |
| UI banner | Orange "DEMONSTRATION MODE" banner | No banner |
| Reset endpoint | `/api/reset-demo` available | Still available (restricted in future auth) |
| Purpose | Evaluation, hackathon demo | Real school deployment |

---

## Health Checks

```bash
# Basic health
curl http://localhost:8000/health

# Readiness (data store loaded)
curl http://localhost:8000/health/ready

# System info (environment, demo mode, AI status)
curl http://localhost:8000/api/system/info
```

---

## Post-Deployment Verification

Run through this checklist after deploying:

```
[ ] http://your-backend/health returns {"status": "ok"}
[ ] http://your-backend/health/ready returns {"status": "ready"}
[ ] Frontend loads at your frontend URL
[ ] Teacher Dashboard shows class completion data
[ ] Class Roster shows 30 students (demo mode) or empty (production mode)
[ ] Aarav Sharma fingerprint loads (demo mode)
[ ] Diagnostics page loads
[ ] Orchestration page loads
[ ] Teach & Adapt page loads
[ ] School Intelligence page loads
[ ] Offline mode toggle works (Navbar badge)
[ ] Demo mode banner visible if DEMO_MODE=true
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| CORS error in browser | Frontend domain not in `CORS_ORIGINS` | Add domain to `CORS_ORIGINS` backend env var |
| "AI unavailable" on fingerprints | No `GEMINI_API_KEY` set | Normal — deterministic fallback active |
| Backend starts with 0 students | `DEMO_MODE=false` | Set `DEMO_MODE=true` for demo deployment |
| 500 errors | Check backend logs for `[request_id]` | Stack traces never sent to client — check server logs |
| Offline sync fails | Backend URL incorrect | Check `VITE_API_BASE_URL` in frontend env |
