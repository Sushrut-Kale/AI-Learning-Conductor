# Demo Script — AI Learning Conductor
## 5-Minute Guided Walkthrough

**Target Audience**: Judges, evaluators, academic coordinators  
**Pre-condition**: Backend running on `:8000`, frontend running on `:3000`  
**Demo student**: Aarav Sharma (`ST001`) — strong reader, subtraction gap

---

## Before You Start

1. Open `http://localhost:3000` in Chrome.
2. Ensure the backend is running: `http://localhost:8000/health` should return `{"status": "ok"}`.
3. Have the application pre-loaded on the Teacher Dashboard screen.

---

## Minute 0:30 — Set the Scene

> **Say**: "Every primary school teacher in a government school is managing 30 to 40 children at once, with no reliable picture of where each child actually stands in foundational learning. AI Learning Conductor changes that — not by replacing teacher judgment, but by structuring and amplifying the evidence teachers already collect."

**Show**: Teacher Dashboard with the Grade 3 — Section A class loaded, completion bar showing 22 of 30 students assessed.

---

## Minute 1:00 — Phase 1: What Has This Child Demonstrated?

**Action**: Click **"View Class"** → search for **"Aarav"** in the roster.

> **Say**: "Aarav Sharma. Strong reader. But something is off in numeracy. Let's look at his Learning Fingerprint — the central Phase 1 output."

**Action**: Click Aarav → **Student Fingerprint**.

**Point out**:
- Green cells: Demonstrated skills
- Yellow cell: 2-Digit Subtraction — Emerging
- The AI narrative at the bottom — point to the label: *"AI-generated from recorded evidence"*

> **Say**: "Notice the AI isn't guessing. Every word here is grounded in what the teacher recorded. Now let's verify that. Click 'Why?'"

**Action**: Click **"Why?"** next to 2-Digit Subtraction.

**Point out**: The Evidence Explorer shows the exact questions, Aarav's exact responses, and the teacher's observation: *"Correctly subtracts units but borrows incorrectly."*

> **Say**: "This is what we mean by evidence-first. No vague scores. The exact moment of confusion, preserved."

---

## Minute 2:00 — Phase 2: What Might Explain This?

**Action**: Click **"Diagnostics"** in the navigation → select Aarav → **Gap Analysis**.

**Point out**:
- The learning gap graph showing the prerequisite chain
- Primary hypothesis: *"Place value confusion — student treats each digit independently"*
- The two alternative hypotheses below it

> **Say**: "The AI has generated a hypothesis. Not a label. A testable, falsifiable explanation grounded in learning science. And critically — the teacher hasn't confirmed it yet. It's a hypothesis, not a fact."

**Point out**: The "Diagnostic Checks" — specific actions the teacher can take to verify or rule out the hypothesis.

> **Say**: "The teacher confirms the hypothesis here before anything downstream uses it."

---

## Minute 2:45 — Phase 3: How Should I Use My Time?

**Action**: Click **"Orchestration"** in the navigation.

**Point out**:
- The classroom is now automatically grouped into 3 focus groups
- Aarav is in **Group B — Subtraction Focus**
- Click **"Why this group?"** on Group B

> **Say**: "Grouping is deterministic — rules-based, not AI. The AI explains the rationale, but doesn't make the grouping decision. The teacher can reassign any student before beginning."

**Action**: Click **"Begin Live Session"** on Group B.

**Point out**: The Live Classroom view with the timer, the focus guide, and the group member cards.

> **Say**: "The teacher now has a focused, evidence-based plan for the next 20 minutes."

---

## Minute 3:30 — Phase 4: What Changed After I Taught?

**Action**: Click **"Teach & Adapt"** in navigation → click on Aarav's intervention card.

**Point out**: The pre-session baseline (hypothesis from Phase 2) vs. the post-session observation field.

**Action**: Click into a pre-filled intervention session → click **"Review Session"**.

**Point out**:
- The trajectory timeline: Before → During → After
- The adaptation signal: *"Hypothesis: Weakened — student successfully borrowed in 2 of 3 attempts after manipulative use"*
- The label: *"Provisional — teacher must confirm"*

> **Say**: "The AI has synthesised what changed. The teacher reviews it, annotates it, and confirms. That confirmation is now new evidence — which feeds forward into Phase 5."

---

## Minute 4:15 — Phase 5: What Patterns Are Emerging Across Classrooms?

**Action**: Click **"School Intelligence"** in navigation.

**Point out**:
- The class-level signals panel: *"14 students show emerging subtraction gaps — possible place value confusion pattern"*
- The signal reasoning: click **"View Reasoning"**
- The AI brief for the coordinator

> **Say**: "The academic coordinator sees this. Not individual student names. A pattern. A signal. With reasoning. They review it — here — and decide whether to act."

**Point out**: The "Mark Reviewed" and "Escalate" buttons.

> **Say**: "The system never acts automatically. The coordinator is always in the loop."

---

## Minute 5:00 — Close

> **Say**: "What you've just seen is a complete, closed loop. Observe. Understand. Act. Learn. Scale. Review. New evidence. Every output is traceable. Every AI claim is labelled. Every decision belongs to the teacher."

> **Headline**: "We are not building AI that teaches children. We are building AI that helps teachers understand children — so that teachers can teach better."

---

## Handling Questions

| Question | Response |
|---|---|
| "What if the AI hypothesis is wrong?" | "The teacher confirms it before it propagates. Any override becomes higher-priority evidence than the AI output." |
| "Does this work offline?" | "Yes. Toggle the 'Online' badge in the navbar to see offline mode. Assessment and fingerprints work fully without internet." |
| "How do you prevent bias?" | "By grounding everything in teacher-recorded evidence, labelling all AI outputs, and making overrides the primary correction mechanism. See RESPONSIBLE_AI.md." |
| "What framework does the assessment use?" | "EGRA and EGMA-inspired, aligned to ASER and CBSE FLN taxonomies. Assessment items are in Hindi, Marathi, and English." |
| "Is student data safe?" | "All data stays in the browser (IndexedDB) or on the school's own server. Nothing is sent to Gemini except anonymised structured summaries." |
