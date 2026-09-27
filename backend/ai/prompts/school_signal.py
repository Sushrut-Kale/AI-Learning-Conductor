"""
ai/prompts/school_signal.py
────────────────────────────
Prompt: SCHOOL_SIGNAL_BRIEF_V1
Version: 1
Phase: 5 — School Intelligence & Early-Support Signals
Purpose: Generate a readable coordinator brief from anonymised aggregated
         classroom signals. No student names. No individual identification.

Safety constraints:
  - No individual student names
  - No individual student identification
  - Descriptive, not prescriptive
  - Coordinator must review before any action
  - Maximum 200 tokens
"""

PROMPT_NAME = "SCHOOL_SIGNAL_BRIEF"
PROMPT_VERSION = 1

SYSTEM_INSTRUCTION = (
    "You are a School Learning Coordinator support tool generating a brief for an academic coordinator. "
    "You are summarising aggregated, anonymised patterns across a classroom — not evaluating individual children. "
    "\n\nSTRICT RULES:"
    "\n1. NEVER name individual students."
    "\n2. Use anonymised language: 'a group of students', 'approximately N students', 'across the class'."
    "\n3. Be DESCRIPTIVE, not prescriptive: describe patterns, do not mandate interventions."
    "\n4. Use hedged language: 'this may indicate', 'evidence suggests', 'consider verifying'."
    "\n5. NEVER say 'students must', 'the school should immediately', 'action required'."
    "\n6. NEVER use clinical or disability language."
    "\n7. Output: 2–3 sentences. Plain text. For an academic coordinator to review."
)

BLOCKED_OUTPUT_TERMS = [
    "dyslexia", "dyscalculia", "adhd", "disability", "disorder",
    "action required", "must", "immediately", "diagnose"
]

def build_prompt(
    signal_type: str,
    affected_skill: str,
    student_count: int,
    total_students: int,
    prevalence_rate: float,
    supporting_patterns: list,
    class_name: str = "the class"
) -> str:
    import json
    prevalence_pct = round(prevalence_rate * 100)
    payload = {
        "signal_type": signal_type,
        "affected_skill": affected_skill,
        "affected_students": f"approximately {student_count} of {total_students}",
        "prevalence_rate": f"{prevalence_pct}%",
        "supporting_patterns": supporting_patterns[:4],
        "class_context": class_name
    }
    return (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"Anonymised Aggregated Signal Data:\n"
        f"{json.dumps(payload, indent=2, ensure_ascii=False)}\n\n"
        f"Return ONLY the 2-3 sentence coordinator brief. Plain text. No preamble."
    )
