# AI Learning Conductor — Phase 1: Assess & Build the Learning Map

> **Core Motto**: *“Before asking AI how to teach a child, first make sure AI understands what the child has actually demonstrated.”*

[![Platform](https://img.shields.io/badge/Platform-AI%20Learning%20Conductor-blue.svg)](https://github.com/Sushrut-Kale/AI-Learning-Conductor)
[![Phase](https://img.shields.io/badge/Phase-1%3A%20Assess%20%26%20Map-emerald.svg)]()
[![Stack](https://img.shields.io/badge/Tech%20Stack-FastAPI%20%7C%20React%20%7C%20IndexedDB%20%7C%20Gemini-indigo.svg)]()
[![Grounding](https://img.shields.io/badge/AI%20Safety-Strict%20Evidence%20Grounding-success.svg)]()

---

## 1. Problem & Vision

In typical classrooms, teachers instruct 30+ children simultaneously without an actionable, evidence-based picture of individual foundational learning levels. 

**AI Learning Conductor** solves this in **Phase 1** not by generating arbitrary exam scores, but by building a reliable, structured **Learning Map** for every child. This map preserves concrete assessment evidence to later power AI gap diagnosis (Phase 2), dynamic grouping (Phase 3), and differentiated instruction (Phase 4).

### Key Rules of Phase 1:
- **Evidence-First**: We preserve raw task evidence (`question_stimulus`, `expected_response`, `student_response`, `teacher_observation`).
- **No Unsupported Conclusions**: Never label a child with vague psychological conclusions like *"Student is weak in mathematics"*. Instead: *"Student correctly solved single-digit addition but incorrectly solved 2-digit addition in 3 of 5 attempts."*
- **Explainability**: Every statement in a student's profile features a **"Why?"** drill-down directly showing the exact questions, responses, and observations.
- **Teacher In The Loop**: The teacher remains the definitive decision-maker with full authority to review, override, annotate, and verify profiles.

---

## 2. Technology Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Offline Storage**: IndexedDB (via Dexie.js) with sync queue for resilient offline assessment in low-connectivity schools
- **Backend**: FastAPI (Python 3.13) + Pydantic v2 validation + REST API
- **AI Layer**: Google Gemini (via REST API) + Deterministic Heuristic Engine fallback with strict anti-hallucination validation against ground-truth response tables

```
+-----------------------------------------------------------------------+
|                            TEACHER BROWSER                            |
|                                                                       |
|  +--------------------+   +-------------------+   +----------------+  |
|  | Teacher Dashboard  |   | Class Overview    |   | Assessment UI  |  |
|  +--------------------+   +-------------------+   +----------------+  |
|  +--------------------+   +-------------------+   +----------------+  |
|  | Learning Fingerprint   | Evidence Explorer |   | Learning Map   |  |
|  +--------------------+   +-------------------+   +----------------+  |
|                            |                          |               |
|            (Offline Write) v                          v (Offline Read)|
|       +-------------------------------------------------------+       |
|       |     Client-Side IndexedDB (Dexie.js Offline Cache)    |       |
|       +-------------------------------------------------------+       |
|                                    | (Sync Queue)                     |
+------------------------------------|----------------------------------+
                                     v
+-----------------------------------------------------------------------+
|                            FASTAPI BACKEND                            |
|                                                                       |
|  +-----------------+   +--------------------+   +------------------+  |
|  | Evidence Engine |-->| Anti-Hallucination |-->| Gemini LLM /     |  |
|  | (Deterministic) |   | Validation Layer   |   | Heuristic Engine |  |
|  +-----------------+   +--------------------+   +------------------+  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | In-Memory / SQLite Evidence Datastore (30 Pre-Seeded Students)  |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

---

## 3. The 6 Prototype Screens

| Screen | Purpose | Key Features |
|---|---|---|
| **1. Teacher Dashboard** | Class management & completion tracking | Completion progress bar (Completed ✓, In Progress ◐, Not Assessed ○), 4 demo archetype launchers, principle banner. |
| **2. Class Overview** | Classroom roster & student search | Search by student name/roll, status filter pills, student metadata, quick action triggers. |
| **3. Assessment Interface** | Rapid, teacher-friendly assessment | Large high-contrast stimuli, 1-click marking (`✓ Correct` / `✗ Incorrect`), keyboard shortcuts (`1` / `2`), voice dictation for observations. |
| **4. Student Learning Fingerprint** | Central Phase 1 deliverable | Categorized skills (`Demonstrated` / `Emerging` / `Not Yet`), quantitative metrics, grounded AI narrative, teacher override modal. |
| **5. Evidence Explorer ("Why?")** | Deep explainability & audit trail | Full item-by-item response table, filter by skill, stimulus, target, actual student response, and teacher notes. |
| **6. Classroom Learning Map** | Classroom-level foundational landscape | 2D Progression Matrix for Literacy & Numeracy, visual distribution bars, interactive student popover modals, Phase 2 transition roadmap. |

---

## 4. Assessment Frameworks (Inspired By)

The assessment structure is inspired by recognized foundational literacy and numeracy principles:
- **Literacy (EGRA / ASER Inspired)**:
  1. *Letter Recognition* (Letters like `क`, `म`, `m`, `b`)
  2. *Word Reading* (Words like `घर`, `शाळा`, `school`)
  3. *Sentence Reading* (`मी रोज शाळेत जातो.`)
  4. *Paragraph Reading* (Multi-sentence contextual passage)
  5. *Comprehension* (Passage recall questions)
- **Numeracy (EGMA / CBSE FLN Inspired)**:
  1. *Number Recognition* (1-99)
  2. *Number Comparison* (Which is greater / smaller)
  3. *Basic Operations* (Single-digit addition & subtraction)
  4. *2-Digit Addition* (With and without regrouping)
  5. *2-Digit Subtraction* (With and without borrowing)
  6. *Basic Multiplication* (Equal grouping concept)

*(Notice: Frameworks are used as modular design references; this is not an official ASER or CBSE publication).*

---

## 5. Demo Scenario (30 Students Pre-Seeded)

The prototype includes a pre-seeded classroom: **"Grade 3 — Section A"** with 30 students:
- **22 Completed Students** with diverse, realistic foundational profiles.
- **2 In-Progress Students** for instant resumption.
- **6 Not-Assessed Students** ready for live demonstration.

### Key Archetypes for Live Demonstration:
1. **Student A: Aarav Sharma** (`ST001`) — Strong Reading, Subtraction Emerging
2. **Student B: Ananya Deshmukh** (`ST002`) — Strong Numeracy, Emerging Reading
3. **Student C: Rohan Kulkarni** (`ST003`) — Emerging in both Literacy and Numeracy
4. **Student D: Priya Gaikwad** (`ST004`) — Demonstrated in both domains
5. **Live Assessment Candidate: Arjun Nalawade** (`ST025`) — Unassessed student to demonstrate live recording, voice observation, and fingerprint generation in under 60 seconds!

---

## 6. What Is Explicitly Excluded In Phase 1

To keep Phase 1 focused on **evidence collection and mapping**, the following belong strictly to later phases:
- ❌ Dynamic grouping (Phase 3)
- ❌ Lesson planning & automated worksheets (Phase 4)
- ❌ Misconception diagnosis or disability labeling (Phase 2/5)
- ❌ Student ranking or high-stakes judgment

---

## 7. Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Start the Backend API
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Backend will be live at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

## 8. Offline-First Verification

1. Click the **"Online"** badge in the top navigation bar to toggle **"Offline Mode"**.
2. Conduct an assessment or adjust a student's profile.
3. Observe responses saving seamlessly to local browser **IndexedDB**.
4. Toggle back to **"Online"** and click **"Sync"** to merge locally cached records into the cloud database.

---

## 9. Future Roadmap: From Phase 1 to Phase 5

```
+--------------------------------------------------------------------+
|  PHASE 1 (Built): Assess & Build the Evidence Learning Map         |
+--------------------------------------------------------------------+
                                   |
                                   v
+--------------------------------------------------------------------+
|  PHASE 2: Diagnose Gaps & Recommend Next Learning Moves            |
+--------------------------------------------------------------------+
                                   |
                                   v
+--------------------------------------------------------------------+
|  PHASE 3: Orchestrate Classroom & Dynamic Differentiated Grouping  |
+--------------------------------------------------------------------+
                                   |
                                   v
+--------------------------------------------------------------------+
|  PHASE 4: Adaptive Teaching & Daily Teacher Workflows              |
+--------------------------------------------------------------------+
                                   |
                                   v
+--------------------------------------------------------------------+
|  PHASE 5: Advanced Foundational AI Layer                           |
+--------------------------------------------------------------------+
```
