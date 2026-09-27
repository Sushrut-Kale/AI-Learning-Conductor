# AI Learning Conductor

> *"Before asking AI what to teach a child, first make sure AI understands what the child has actually demonstrated."*

[![Platform](https://img.shields.io/badge/Platform-AI%20Learning%20Conductor-17365D.svg)](https://github.com/Sushrut-Kale/AI-Learning-Conductor)
[![Phases](https://img.shields.io/badge/Phases-1%20through%205-6B4226.svg)]()
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20IndexedDB%20%7C%20Gemini-4B5563.svg)]()
[![License](https://img.shields.io/badge/Responsible%20AI-Evidence--Grounded-2E7D32.svg)]()

---

## What Is This?

**AI Learning Conductor** is a five-phase, evidence-grounded classroom intelligence system for primary school teachers in low-resource government schools.

It does not generate worksheets. It does not rank students. It does not replace teachers.

Instead, it gives a teacher one thing that has always been missing at scale: **a verifiable, evidence-backed picture of where every child actually stands**, updated in real time, with every AI inference traceable back to the raw observation that triggered it.

The core loop:

```
SEE (assess evidence)
  ↓
UNDERSTAND (diagnose patterns)
  ↓
ACT (allocate classroom attention)
  ↓
LEARN (observe post-instruction change)
  ↓
SCALE (surface cross-classroom signals)
  ↓
HUMAN REVIEW (teacher remains final authority)
  ↓
NEW EVIDENCE
```

---

## Five Phases — One Continuous Workflow

| Phase | Name | Question Answered |
|---|---|---|
| **1** | Assess & Build the Learning Map | What has the child actually demonstrated? |
| **2** | Diagnose & Find the Gap | What learning pattern may explain the evidence? |
| **3** | Orchestrate the Classroom | How should a teacher allocate limited attention? |
| **4** | Teach, Observe & Adapt | What changed after instruction? |
| **5** | School Intelligence & Early-Support Signals | What patterns are emerging across classrooms? |

---

## Quick Start

### Prerequisites

- Node.js v18+
- Python 3.10+
- A Google Gemini API key (set as `GEMINI_API_KEY` environment variable)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Application: `http://localhost:3000`

---

## Architecture

```
+-----------------------------------------------------------+
|                     TEACHER BROWSER                       |
|                                                           |
|  Phase 1: Assess   Phase 2: Diagnose   Phase 3: Orchestrate  |
|  Phase 4: Teach    Phase 5: School Intelligence           |
|                           |                               |
|          (Offline write)  v         (Offline read)        |
|    +-----------------------------------------------+      |
|    |   IndexedDB (Dexie.js — offline-first cache)  |      |
|    +-----------------------------------------------+      |
|                           | (Sync Queue)                  |
+---------------------------|-------------------------------+
                            v
+-----------------------------------------------------------+
|                     FASTAPI BACKEND                       |
|                                                           |
|  Evidence Engine ──► Anti-Hallucination Validation        |
|                              ──► Gemini / Heuristic Layer |
|                                                           |
|  Deterministic Engines: Diagnosis, Orchestration,         |
|  Adaptation, School Intelligence                          |
|                                                           |
|  In-memory DataStore (30 pre-seeded students)             |
+-----------------------------------------------------------+
```

### Key Design Principles

1. **Evidence-First**: Every AI output is grounded in concrete teacher-recorded evidence.
2. **Deterministic Core**: Grouping, gap scoring, and signal detection are rules-based. AI adds synthesis, not decisions.
3. **Teacher Authority**: Every AI inference can be reviewed, annotated, and overridden.
4. **Explainability**: Every label links back to the exact question, response, and observation that produced it.
5. **Offline-First**: The app functions without internet; data syncs when connectivity is restored.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Offline Storage | IndexedDB via Dexie.js |
| Backend | FastAPI (Python 3.13) + Pydantic v2 |
| AI | Google Gemini (gemini-2.0-flash) |
| Engines | Pure Python deterministic heuristics |

---

## Demo Scenario

The prototype ships with a pre-seeded classroom: **Grade 3 — Section A** (30 students).

### Key demo students:

| ID | Name | Profile |
|---|---|---|
| ST001 | Aarav Sharma | Strong reading; subtraction gap → full diagnostic chain |
| ST002 | Ananya Deshmukh | Strong numeracy; emerging reading |
| ST003 | Rohan Kulkarni | Emerging both domains |
| ST004 | Priya Gaikwad | Demonstrated both domains |
| ST025 | Arjun Nalawade | Unassessed — use for live demo |

### Recommended 5-minute demo path:

1. **Dashboard** → see class completion status
2. **Class Roster** → search "Aarav" → open fingerprint
3. **Fingerprint** → click "Why?" on subtraction gap → Evidence Explorer
4. **Diagnostics** → Aarav → Gap Analysis → hypothesis chain
5. **Orchestration** → class plan → group allocation
6. **Teach & Adapt** → start session → log observation → review
7. **School Intelligence** → cross-class signals → mark reviewed

---

## Documentation

Full documentation is in the [`/docs`](docs/) folder:

| Document | Description |
|---|---|
| [Product Requirements](docs/PRD.md) | Full product specification |
| [AI Architecture](docs/AI_ARCHITECTURE.md) | Gemini integration, safety constraints, anti-hallucination |
| [Data Model](docs/DATA_MODEL.md) | Evidence schema and data flow |
| [Responsible AI](docs/RESPONSIBLE_AI.md) | Transparency, human oversight, bias mitigations |
| [Demo Script](docs/DEMO_SCRIPT.md) | 5-minute guided walkthrough script |
| [API Reference](http://localhost:8000/docs) | Live FastAPI Swagger documentation |

---

## Assessment Frameworks (Reference)

Inspired by recognised foundational literacy and numeracy frameworks:

- **Literacy**: EGRA / ASER-India framework (letter → word → sentence → paragraph → comprehension)
- **Numeracy**: EGMA / CBSE FLN framework (number recognition → comparison → operations → 2-digit → multiplication)

*This is not an official ASER or CBSE publication. Frameworks are used as modular design references.*

---

## What Is Deliberately Excluded

- ❌ Student rankings or scores
- ❌ Automated lesson generation without teacher review
- ❌ Disability labels or psychological conclusions
- ❌ Teacher performance rankings
- ❌ Any output not traceable to collected evidence

---

## Responsible AI Commitment

Every AI-generated output in this system:

1. Is clearly labelled as AI-generated
2. Displays the evidence that grounded it
3. Can be overridden by the teacher
4. Is reviewed before triggering any school-level action
5. Is never used alone to determine resource allocation

See [`docs/RESPONSIBLE_AI.md`](docs/RESPONSIBLE_AI.md) for the full statement.
