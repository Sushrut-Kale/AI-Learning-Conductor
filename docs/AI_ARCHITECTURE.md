# AI Architecture Document
## AI Learning Conductor — Evidence-Grounded AI Design

**Version**: 1.0  
**Classification**: Internal Technical Reference

---

## 1. Design Philosophy

This system uses AI in exactly one way: **to synthesise and articulate patterns that a teacher has already observed, not to invent new conclusions about a child.**

The boundary between AI and deterministic computation is explicit throughout:

| Layer | Mechanism | Trust Level |
|---|---|---|
| Raw evidence collection | Human (teacher) | Ground truth |
| Skill classification | Deterministic rules | Verified |
| Gap scoring | Deterministic heuristics | Verified |
| Group allocation | Deterministic algorithm | Verified |
| Pre/post comparison | Deterministic arithmetic | Verified |
| Narrative generation | Gemini (AI) | Labelled, reviewable |
| Hypothesis synthesis | Gemini (AI) | Labelled, requires teacher confirmation |
| Signal synthesis | Gemini (AI) | Labelled, requires coordinator review |

---

## 2. AI Component Inventory

### 2.1 Phase 1 — Learning Fingerprint Narrative

**Purpose**: Convert a teacher's raw skill evidence into a readable, professional summary paragraph.

**Input**:
```json
{
  "student_name": "Aarav Sharma",
  "demonstrated": ["Letter Recognition", "Word Reading", "Number Recognition"],
  "emerging": ["2-Digit Subtraction"],
  "not_yet": ["Paragraph Reading"],
  "evidence_count": 45
}
```

**Prompt Strategy**:
- Strict evidence-grounding instruction: "Do not include any claim not supported by the evidence provided."
- Role: "You are a learning assessment specialist writing a factual, evidence-based summary."
- Output length: ≤ 5 sentences

**Anti-Hallucination Validation**:
- Output is parsed; any claim containing a skill name not in the input is flagged and rejected
- Rejected outputs fall back to a deterministic template

---

### 2.2 Phase 2 — Hypothesis Generation

**Purpose**: Generate a plausible learning-science explanation for a specific observed skill gap.

**Input**:
```json
{
  "gap_skill": "2-Digit Subtraction",
  "prerequisite_skills": ["Basic Subtraction", "Number Comparison"],
  "demonstrated_prerequisites": ["Number Comparison"],
  "missing_prerequisites": ["Basic Subtraction"],
  "evidence_examples": ["Q: 42-17=? Expected: 25. Actual: 35 (subtracted units correctly but borrowed incorrectly)"]
}
```

**Prompt Strategy**:
- Generates exactly 1 primary hypothesis + 2 alternative hypotheses
- Each hypothesis includes: title, mechanism, prerequisite chain, suggested diagnostic check
- Instruction: "Do not make psychological or neurological claims. Stick to observable learning patterns."

**Guardrails**:
- Hypothesis titles are checked against a blocklist (e.g., "dyslexia", "ADHD", "learning disability")
- If blocked terms detected, hypothesis is rejected and teacher is shown a fallback with a note

---

### 2.3 Phase 4 — Adaptation Synthesis

**Purpose**: After a teaching session, summarise what changed and whether the intervention appears to have been effective.

**Input**: Pre-session evidence + post-session teacher observations (voice transcript + text notes)

**Prompt Strategy**:
- Explicitly states pre-session baseline
- Lists all new teacher observations verbatim
- Asks: "Based only on what the teacher observed in this session, has the hypothesis been supported, weakened, or unchanged? Generate one sentence each."

**Safety**: 
- Adaptation signals are labelled "Provisional — requires teacher confirmation"
- Teacher must explicitly mark "Confirmed" before signal propagates to Phase 5

---

### 2.4 Phase 5 — School Intelligence Brief

**Purpose**: Generate a readable, concise paragraph summarising a cross-class signal for academic coordinators.

**Input**: Aggregated signal data (class IDs, prevalence rates, affected skill, pattern description — no student names)

**Prompt Strategy**:
- Student anonymisation is enforced server-side before any data reaches Gemini
- Output is strictly descriptive, not prescriptive ("15 students across 3 classes show emerging gaps in..." not "The school should...")
- Recommendations section is generated separately and labelled "AI Suggestions — Pending Coordinator Review"

---

## 3. Gemini Integration

### Model

```
gemini-2.0-flash
```

Chosen for: low latency, strong instruction-following, cost-efficiency for high-frequency classroom tool.

### API Call Pattern

```python
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")

response = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0.2,       # Low temperature for factual synthesis
        max_output_tokens=512, # Short, focused outputs
        candidate_count=1,
    ),
    safety_settings=[
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_LOW_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_LOW_AND_ABOVE"},
    ]
)
```

### Fallback Hierarchy

```
1. Gemini API call
   ↓ (if API unavailable or validation fails)
2. Deterministic heuristic template
   ↓ (if template cannot be generated)
3. Explicit "AI unavailable" notice shown to teacher
```

No silent failures. Teacher is always informed when AI is unavailable or when output has been auto-rejected.

---

## 4. Anti-Hallucination Architecture

### 4.1 Input Sanitisation

All AI inputs are constructed programmatically from the DataStore. No free-text from the teacher is passed as-is into prompts that generate conclusions about a child. Teacher voice observations are passed verbatim but are clearly labelled as unstructured input, not as structured facts.

### 4.2 Output Validation

```python
def validate_fingerprint_narrative(narrative: str, valid_skills: list[str]) -> bool:
    """
    Reject any narrative that asserts a skill the student was not assessed on.
    """
    for skill in extract_skill_claims(narrative):
        if skill not in valid_skills:
            return False
    return True
```

### 4.3 Blocklist Enforcement

Clinical or psychological terms are blocked from appearing in AI outputs that describe individual students:

```python
BLOCKED_CLINICAL_TERMS = [
    "dyslexia", "dyscalculia", "ADHD", "autism", 
    "learning disability", "cognitive impairment",
    "mentally", "neurological"
]
```

If a blocked term appears in output, the output is rejected and the fallback template is used.

### 4.4 Confidence Labelling

Every AI output in the UI carries a label:

- 🔵 "AI-generated — based on recorded evidence"
- 🟡 "AI hypothesis — confirm before acting"
- 🔴 "AI synthesis — coordinator review required"

---

## 5. Privacy & Data Flow

```
Teacher Records Observation
        ↓
IndexedDB (local, encrypted)
        ↓ (on sync)
FastAPI Backend (in-memory DataStore)
        ↓ (structured summary only — no PII)
Gemini API
        ↓
AI Output → Validation → Display
```

**What is never sent to Gemini**:
- Student full names in Phase 5 (only anonymised IDs)
- Raw voice recordings (only transcribed text summary)
- Any data not directly relevant to the AI task
