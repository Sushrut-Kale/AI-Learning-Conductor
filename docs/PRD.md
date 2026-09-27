# Product Requirements Document
## AI Learning Conductor — Phases 1–5

**Version**: 1.0  
**Status**: Prototype / Hackathon Submission  
**Classification**: Internal — Not for public distribution  
**Last Updated**: September 2026

---

## 1. Executive Summary

AI Learning Conductor is a five-phase classroom intelligence system for primary school teachers in government schools. It addresses a single, critical gap in Indian foundational learning: teachers have no reliable, actionable, evidence-backed picture of where each child actually stands.

The system replaces vague impressions with structured evidence, and replaces generic AI outputs with grounded, explainable, teacher-reviewable intelligence.

---

## 2. Problem Statement

### 2.1 The Foundational Learning Crisis

India's Annual Status of Education Report (ASER) 2023 reports that more than 50% of Grade 5 students in government schools cannot read a Grade 2 text. The gap is not primarily a resource gap — it is an **information gap**.

Teachers in typical government classrooms:
- Manage 30–45 students simultaneously
- Lack structured, per-student evidence of foundational competency
- Rely on whole-class instruction with no group differentiation
- Have no feedback loop that tells them if an intervention worked

### 2.2 What AI Currently Gets Wrong in Education

Most EdTech AI tools in this space:
- Generate lesson plans without knowing what a specific child actually understands
- Produce student risk scores with no traceable reasoning
- Replace teacher judgment rather than informing it
- Work only with connectivity, failing in rural deployments

### 2.3 The Core Problem We Solve

> Before asking AI what to teach a child, make sure AI understands what the child has actually demonstrated.

---

## 3. Product Vision

A single, continuous, evidence-grounded workflow that takes a teacher from **raw observation** to **school-level pattern detection** — with every step traceable, reviewable, and overridable.

### Core Loop

```
SEE → UNDERSTAND → ACT → LEARN → SCALE → HUMAN REVIEW → NEW EVIDENCE
```

---

## 4. Target Users

| User | Role | Primary Interactions |
|---|---|---|
| **Classroom Teacher** | Primary user | Phases 1–4 daily |
| **Academic Coordinator** | School-level reviewer | Phase 5 signals |
| **Block Resource Person** | External reviewer | Phase 5 cross-class reports |
| *(Future)* Curriculum Lead | System admin | Configuration |

---

## 5. Phase Specifications

### Phase 1 — Assess & Build the Learning Map

**Question Answered**: "What has this child actually demonstrated?"

**Core outputs**:
- Per-student Learning Fingerprint (skill × status matrix)
- Raw evidence table (stimulus, expected response, student response, teacher observation)
- AI-generated narrative grounded strictly in evidence
- Classroom Learning Map (2D progression matrix)

**Key rules**:
- No conclusions without evidence
- Teacher can override any AI label
- Full audit trail to source observation

**Screens**: Teacher Dashboard, Class Roster, Assessment Interface, Learning Fingerprint, Evidence Explorer, Classroom Learning Map

---

### Phase 2 — Diagnose & Find the Gap

**Question Answered**: "What learning pattern may explain this evidence?"

**Core outputs**:
- Diagnostic Overview (class-level gap summary)
- Per-student Gap Analysis with learning gap graph
- Hypothesis chain (primary + alternative hypotheses)
- Prerequisite reasoning (what foundational concept is missing)
- Diagnostic checks (suggested teacher verification actions)

**Key rules**:
- Hypotheses are always labelled as probabilistic
- Alternative hypotheses are always shown
- Teacher must confirm before hypothesis is acted upon

**Screens**: Diagnostic Overview, Student Gap Analysis, Learning Gap Graph, Hypothesis Card

---

### Phase 3 — Orchestrate the Classroom

**Question Answered**: "How should I allocate my limited teaching time?"

**Core outputs**:
- Classroom Orchestration Plan (deterministic grouping)
- Group allocation with rationale ("Why this group?")
- Instructional path cards per group
- Time block allocation recommendations
- Live Classroom mode (timer + group guide)

**Key rules**:
- Grouping is deterministic (rules-based, not AI)
- Every group allocation links to diagnostic evidence
- Teacher can reassign any student manually

**Screens**: Classroom Orchestration, Orchestration Why Modal, Instructional Path Card, Live Classroom

---

### Phase 4 — Teach, Observe & Adapt

**Question Answered**: "What changed after I taught?"

**Core outputs**:
- Teach & Adapt Dashboard (per-student intervention queue)
- Live Teaching View (multimodal session with voice + text capture)
- Post-session Observation logging
- Adaptation Engine output (revised hypothesis, updated trajectory)
- Intervention Review View (trajectory timeline, signal review)

**Key rules**:
- Pre/post evidence comparison is always shown
- AI adaptation suggestions require teacher confirmation
- Every session outcome is stored as new evidence

**Screens**: Teach & Adapt Dashboard, Live Teaching View, Intervention Review View, Student Trajectory Modal

---

### Phase 5 — School Intelligence & Early-Support Signals

**Question Answered**: "What patterns are emerging across classrooms?"

**Core outputs**:
- School-level signal dashboard
- Cross-class prevalence metrics
- AI-generated synthesis (always labelled)
- Signal review workflow (mark reviewed / escalate / note)
- Brief generation (for academic coordinator)

**Key rules**:
- No student is individually named in cross-class signals
- All signals require academic coordinator review before action
- Signal reasoning is always displayed
- Signals never automatically trigger resource allocation

**Screens**: School Intelligence Dashboard, Signal Review, Brief Generator

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Offline operation | Full assessment, fingerprint, and orchestration without internet |
| Sync | Queue-based sync on reconnection |
| Load time | < 2 seconds for fingerprint, < 5 seconds for diagnostics |
| Accessibility | Keyboard navigation, high-contrast mode, min 14px body type |
| Data residency | All data remains in-browser (IndexedDB) or on school server |

---

## 7. What Is Explicitly Excluded

| Feature | Reason for Exclusion |
|---|---|
| Student leaderboards / rankings | Harmful to motivation; unsupported by evidence |
| Teacher performance scores | Not within scope; requires HR policy |
| Automated lesson delivery | Requires verified remedial content library |
| Disability classification | Requires clinical expertise; out of scope for this tool |
| Parent-facing portal | Future phase; privacy policy required |
| Chatbot interface for students | Out of scope; different safety requirements |

---

## 8. Success Metrics (Prototype)

| Metric | Target |
|---|---|
| Evidence completeness | ≥ 90% of assessments with at least 1 teacher observation |
| AI output override rate | < 30% (indicates calibration quality) |
| Diagnostic accuracy | Hypothesis confirmed by teacher in ≥ 70% of cases |
| School signal review rate | ≥ 80% of signals reviewed within 48 hours |
| Offline resilience | 0 data loss during offline → online transition |
