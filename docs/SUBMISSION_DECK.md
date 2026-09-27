# Submission Proposal Deck
## AI Learning Conductor — 7-Slide Narrative

*This document contains the narrative and key points for each slide. Use these as the authoritative source for any presentation materials.*

---

## Slide 1 — Cover

**Title**: AI Learning Conductor

**Subtitle**: Evidence-grounded classroom intelligence for government primary schools

**Tagline**: *"Before asking AI what to teach a child, first make sure AI understands what the child has actually demonstrated."*

**Visual**: The five-phase loop diagram:
```
SEE → UNDERSTAND → ACT → LEARN → SCALE
```

---

## Slide 2 — The Problem

**Headline**: 50% of Grade 5 students in government schools cannot read a Grade 2 text.

**This is not a resource gap. It is an information gap.**

**Three things every classroom teacher lacks:**

1. **A reliable, per-student picture** of foundational skills — not a gut feeling, not a term exam score, but evidence.
2. **A way to translate that picture into a teaching plan** that works for 30 children simultaneously.
3. **A feedback loop** that tells them whether last week's intervention worked.

**The result**: Generic instruction for a wildly heterogeneous classroom. Children who are behind fall further behind, invisibly.

**Source**: ASER 2023 Annual Report

---

## Slide 3 — The Product

**Headline**: Five phases. One closed loop. Evidence at every step.

| Phase | Name | Question |
|---|---|---|
| 1 | Assess & Map | What has this child actually demonstrated? |
| 2 | Diagnose | What pattern explains the evidence? |
| 3 | Orchestrate | How do I allocate my 45 minutes? |
| 4 | Teach & Adapt | What changed after I taught? |
| 5 | School Intelligence | What patterns are emerging across classrooms? |

**Key design choices:**
- Every output is traceable to raw teacher-recorded evidence
- AI synthesises; it does not decide
- Teacher remains the final authority at every step
- Works offline in low-connectivity rural schools

---

## Slide 4 — The Evidence Chain

**Headline**: Every AI output is a synthesis of teacher observations — not an invention.

**Walk through the chain:**

```
Teacher records: "Aarav subtracted units correctly but borrowed incorrectly."
         ↓
Learning Fingerprint: 2-Digit Subtraction — Emerging
         ↓
Diagnostic Hypothesis: "Place value confusion — treats digits independently"
         ↓
Orchestration: Aarav → Group B — Subtraction Focus
         ↓
Teaching Session: Manipulatives used. Teacher observes partial success.
         ↓
Adaptation Signal: Hypothesis weakened — student improving.
         ↓
School Signal: 14 students show similar pattern across class.
```

At each step: **raw evidence is cited**, **AI label is shown**, **teacher can override**.

---

## Slide 5 — The AI Design

**Headline**: AI is used in exactly three ways — all labelled, all reviewable.

| Use | What AI does | What AI does NOT do |
|---|---|---|
| Narrative generation | Writes a readable summary of teacher evidence | Makes judgments not in the evidence |
| Hypothesis synthesis | Generates testable explanations for observed gaps | Diagnoses conditions or labels children |
| Pattern briefs | Writes coordinator summaries from anonymised signals | Names students or recommends resource cuts |

**Safety architecture:**
- Output validation rejects any AI claim not grounded in collected evidence
- Clinical/psychological terms are blocklisted from all student-facing outputs
- Every AI output carries a visible label: "AI-generated — based on recorded evidence"
- Offline fallback: deterministic templates when API is unavailable

---

## Slide 6 — The Technology

**Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Offline: IndexedDB via Dexie.js (full offline assessment capability)
- Backend: FastAPI (Python 3.13) + Pydantic v2
- AI: Google Gemini (gemini-2.0-flash) with strict prompt constraints

**What is deterministic (rules-based):**
- Skill classification from assessment items
- Gap severity scoring
- Student grouping algorithm
- Pre/post comparison calculation
- Signal prevalence calculation

**What uses Gemini:**
- Learning Fingerprint narrative
- Diagnostic hypothesis generation
- Adaptation synthesis
- School Intelligence brief

**Validation layer prevents AI from speaking beyond what the evidence supports.**

---

## Slide 7 — Impact & Next Steps

**This prototype demonstrates:**

✓ A complete, working 5-phase evidence loop with 30 pre-seeded students  
✓ Full offline capability — functions in schools with no internet  
✓ Strict evidence grounding — AI never speaks beyond what was observed  
✓ Teacher-first design — every AI output reviewable and overridable  
✓ School-level intelligence without individual student surveillance  

**What a real deployment would require:**

1. A peer-reviewed foundational skills taxonomy (collaborate with ASER, SCERT)
2. Classroom-validated assessment content in regional languages
3. A teacher onboarding and support programme
4. A school data governance policy
5. A longitudinal evaluation study (6–12 month classroom deployment)

**The system is built to be right about children — not to be impressive about AI.**
