# Data Model Reference
## AI Learning Conductor — Evidence Schema & Data Flow

**Version**: 1.0

---

## 1. Core Principle

Every piece of data in this system is an **evidence record** — a concrete, dated, teacher-recorded observation. No data is inferred or generated without an evidence record as its root.

---

## 2. Entity Hierarchy

```
Class
  └── Student
        └── Assessment (contains AssessmentItems)
              └── AssessmentItem (stimulus → expected → actual → observation)
                    └── EvidenceRecord
                          ├── LearningFingerprint (Phase 1 output)
                          ├── DiagnosticHypothesis (Phase 2 output)
                          ├── OrchestrationPlan (Phase 3 output)
                          ├── InterventionSession (Phase 4 output)
                          └── SchoolSignal (Phase 5 output)
```

---

## 3. Core Schemas

### 3.1 AssessmentItem (atomic evidence unit)

```python
class AssessmentItem(BaseModel):
    item_id: str                    # Unique item identifier
    skill_id: str                   # Skill this item assesses (e.g., "NUM_2D_SUB")
    skill_name: str                 # Human-readable skill name
    domain: str                     # "literacy" or "numeracy"
    question_stimulus: str          # Exact question shown to student
    expected_response: str          # Correct answer
    student_response: str           # What the student actually said/did
    is_correct: bool                # Teacher-marked correctness
    teacher_observation: str        # Free-text teacher note
    timestamp: datetime
```

### 3.2 LearningFingerprint (Phase 1 output)

```python
class LearningFingerprint(BaseModel):
    student_id: str
    generated_at: datetime
    demonstrated_skills: list[str]  # Skills with ≥ 70% correct rate
    emerging_skills: list[str]      # Skills with 40–69% correct rate
    not_yet_skills: list[str]       # Skills with < 40% correct rate
    ai_narrative: str               # Gemini-generated summary
    teacher_overrides: list[SkillOverride]  # Teacher adjustments
    evidence_count: int             # Total items underlying this fingerprint
```

### 3.3 DiagnosticHypothesis (Phase 2 output)

```python
class DiagnosticHypothesis(BaseModel):
    hypothesis_id: str
    student_id: str
    target_skill: str               # The gap being explained
    primary_hypothesis: Hypothesis
    alternative_hypotheses: list[Hypothesis]
    prerequisite_chain: list[str]   # Missing prerequisite skills
    diagnostic_checks: list[str]    # Suggested teacher verification steps
    confidence: float               # 0.0–1.0 (deterministic, not AI)
    teacher_confirmed: bool         # Teacher has reviewed and confirmed
    generated_at: datetime

class Hypothesis(BaseModel):
    title: str
    mechanism: str                  # Plain-language explanation
    supporting_evidence: list[str]  # Evidence item IDs
    ai_generated: bool              # Always true in current system
```

### 3.4 OrchestrationPlan (Phase 3 output)

```python
class OrchestrationPlan(BaseModel):
    plan_id: str
    class_id: str
    created_at: datetime
    groups: list[Group]
    time_blocks: list[TimeBlock]
    teacher_notes: str

class Group(BaseModel):
    group_id: str
    label: str                      # e.g., "Group A — Subtraction Focus"
    student_ids: list[str]
    focus_skill: str
    instructional_path: str
    rationale: str                  # Why these students are grouped
    evidence_basis: list[str]       # Diagnostic hypothesis IDs
```

### 3.5 InterventionSession (Phase 4 output)

```python
class InterventionSession(BaseModel):
    session_id: str
    student_id: str
    hypothesis_id: str              # Which hypothesis this session tests
    started_at: datetime
    ended_at: Optional[datetime]
    pre_evidence: list[str]         # Evidence item IDs before session
    session_observations: list[SessionObservation]
    post_evidence_summary: str      # Teacher's summary of session
    adaptation_signal: AdaptationSignal

class AdaptationSignal(BaseModel):
    signal_type: str                # "supported" | "weakened" | "unchanged" | "new_gap"
    reasoning: str                  # AI synthesis (labelled)
    teacher_confirmed: bool
    confidence: float
```

### 3.6 SchoolSignal (Phase 5 output)

```python
class SchoolSignal(BaseModel):
    signal_id: str
    signal_type: str                # "prevalence" | "progression" | "anomaly"
    affected_skill: str
    affected_class_ids: list[str]   # No student names
    student_count: int              # Anonymised count
    prevalence_rate: float          # 0.0–1.0
    ai_brief: str                   # Gemini synthesis (labelled)
    coordinator_reviewed: bool
    coordinator_notes: str
    generated_at: datetime
```

---

## 4. Data Flow Diagram

```
TEACHER ACTION
     │
     ▼
AssessmentItem (evidence)
     │
     ├──► LearningFingerprint (Phase 1)
     │         │
     │         ▼
     │    DiagnosticHypothesis (Phase 2)
     │         │
     │         ▼
     │    OrchestrationPlan (Phase 3)
     │         │
     │         ▼
     │    InterventionSession (Phase 4)
     │         │
     └─────────┼──────────────────────────────────►
               │                          (new evidence added)
               ▼
          SchoolSignal (Phase 5)
               │
               ▼
         Coordinator Review → NEW EVIDENCE (if intervention recommended)
```

---

## 5. Evidence Traceability

Every downstream object maintains a reference chain to its source evidence:

| Object | Links To |
|---|---|
| LearningFingerprint | AssessmentItem IDs |
| DiagnosticHypothesis | LearningFingerprint ID + AssessmentItem IDs |
| OrchestrationPlan | DiagnosticHypothesis IDs |
| InterventionSession | OrchestrationPlan ID + DiagnosticHypothesis ID |
| SchoolSignal | InterventionSession IDs (anonymised) |

This enables a teacher or coordinator to trace any school-level signal back to the specific classroom moments that generated it.

---

## 6. Offline Storage (IndexedDB Schema)

```javascript
// Dexie.js table definitions
db.version(1).stores({
  classes:     '&id, name',
  students:    '&id, classId, name',
  assessments: '&id, studentId, status, updatedAt',
  evidence:    '&id, studentId, skillId, domain',
  syncQueue:   '++id, type, payload, createdAt'
});
```

Sync queue entries are replayed to the backend API on reconnection, in creation order.

---

## 7. Pre-Seeded Demonstration Data

The backend DataStore (`database.py`) ships with:
- 1 class (Grade 3 — Section A, `CLS_G3A`)
- 30 students with diverse foundational profiles
- ~800 assessment items across all students
- Pre-generated fingerprints, diagnostic hypotheses, orchestration plans, and intervention sessions for key demo students (ST001–ST006)
- School intelligence signals covering the full class

This eliminates the need for judges or evaluators to manually seed data during demonstration.
