# Deployment Checklist — AI Learning Conductor

**Use this checklist before every deployment.**

---

## PRE-DEPLOYMENT

### Secrets & Configuration
- [ ] `GEMINI_API_KEY` set in backend environment (not in source code)
- [ ] `.env` and `.env.local` files confirmed absent from git history
- [ ] `CORS_ORIGINS` set to exact production frontend domain
- [ ] `ENVIRONMENT=production` set on backend
- [ ] `DEMO_MODE` set correctly (`true` for demo, `false` for real school)

### Codebase
- [ ] `git status` clean — no unexpected files
- [ ] `npm run build` passes without errors (frontend)
- [ ] `python -c "import main"` passes without import errors (backend)
- [ ] Backend `requirements.txt` up to date

### Database
- [ ] Data directory exists and is writable (`backend/data/`)
- [ ] SQLite DB initialises cleanly on fresh start

### Testing
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /health/ready` returns `{"status": "ready"}`
- [ ] `GET /api/system/info` returns correct `demo_mode` and `environment`
- [ ] `GET /api/classes` returns class data (demo mode) or empty list (production)

---

## DEPLOYMENT

### Backend
- [ ] Backend deployed and running
- [ ] `GET https://your-backend/health` returns `{"status": "ok"}`
- [ ] Logs accessible on hosting platform

### Frontend
- [ ] Frontend deployed and accessible
- [ ] `VITE_API_BASE_URL` set to deployed backend URL
- [ ] `VITE_DEMO_MODE` set correctly

### Network
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS verified: browser request from frontend reaches backend without CORS error

---

## POST-DEPLOYMENT VERIFICATION

### Core Flow
- [ ] Teacher Dashboard loads and shows class data
- [ ] Class Roster shows students (30 in demo mode, empty in production mode)
- [ ] Demo mode banner visible (if `DEMO_MODE=true`)

### Phase 1 — Assess
- [ ] Student fingerprint loads for Aarav Sharma (ST001) in demo mode
- [ ] Evidence Explorer loads and shows evidence table
- [ ] Assessment Interface loads for unassessed student (ST025)

### Phase 2 — Diagnose
- [ ] Diagnostic Overview loads
- [ ] Student Gap Analysis loads for Aarav (ST001)
- [ ] Hypothesis chain shows primary + alternative hypotheses

### Phase 3 — Orchestrate
- [ ] Classroom Orchestration loads
- [ ] Group plan generates
- [ ] "Why this group?" modal opens

### Phase 4 — Teach & Adapt
- [ ] Teach & Adapt Dashboard loads
- [ ] Intervention session accessible for Aarav (ST001)
- [ ] Session timeline visible

### Phase 5 — School Intelligence
- [ ] School Intelligence Dashboard loads
- [ ] Signals visible with reasoning
- [ ] Signal review action works

### Offline Mode
- [ ] Toggle "Offline Mode" in Navbar — banner changes to orange
- [ ] Assessment submission works offline (saves to IndexedDB)
- [ ] Toggle back to Online — pending sync badge appears
- [ ] "Sync" button processes queue

### AI Fallback
- [ ] If `GEMINI_API_KEY` not set, fingerprint still generates (deterministic narrative)
- [ ] No error shown to user when AI unavailable — graceful fallback

---

## KNOWN LIMITATIONS (Document Before Submission)

- [ ] Authentication not yet implemented — all teachers share one view
- [ ] Rate limiting not implemented
- [ ] Backup not automated
- [ ] PostgreSQL not yet configured (using SQLite — adequate for prototype/demo)
- [ ] HTTPS enforced by hosting platform, not application layer
