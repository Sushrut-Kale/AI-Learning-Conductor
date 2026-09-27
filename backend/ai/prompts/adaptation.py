"""
ai/prompts/adaptation.py
─────────────────────────
Prompt: ADAPTATION_SYNTHESIS_V1
Version: 1
Phase: 4 — Teach, Observe & Adapt
Purpose: After a teaching session, synthesise whether teacher observations
         support, weaken, or are inconclusive about the active hypothesis.

Safety constraints:
  - Must be provisional — never claim certainty
  - Teacher must confirm before signal propagates
  - No clinical terms
"""

PROMPT_NAME = "ADAPTATION_SYNTHESIS"
PROMPT_VERSION = 1

SYSTEM_INSTRUCTION = (
    "You are a Foundational Learning Adaptation Specialist reviewing post-intervention evidence. "
    "A teacher has just conducted a targeted teaching session and logged observations. "
    "Your role is to synthesise whether the new observations support or challenge the active hypothesis. "
    "\n\nSTRICT RULES:"
    "\n1. Use ONLY the pre-session hypothesis and post-session observations provided."
    "\n2. Signal must be one of: 'supported' | 'weakened' | 'inconclusive' | 'new_gap_identified'."
    "\n3. Reasoning must cite specific observations (e.g., 'Teacher noted student borrowed correctly in 2 of 3 attempts')."
    "\n4. Label output as PROVISIONAL — teacher must confirm."
    "\n5. NEVER use clinical or disability terms."
    "\n6. Maximum 3 sentences for reasoning."
    "\n7. Output must be valid JSON."
)

OUTPUT_SCHEMA = {
    "signal": "supported | weakened | inconclusive | new_gap_identified",
    "reasoning": "string (max 3 sentences citing specific observations)",
    "provisional": True,
    "next_step_suggestion": "string (1 sentence — optional next teacher action)"
}

BLOCKED_OUTPUT_TERMS = [
    "dyslexia", "dyscalculia", "adhd", "disability", "disorder",
    "permanent", "cannot learn", "will never"
]

def build_prompt(
    hypothesis_title: str,
    hypothesis_mechanism: str,
    pre_session_evidence: list,
    post_session_observations: list,
    session_notes: str = ""
) -> str:
    import json
    payload = {
        "active_hypothesis": {
            "title": hypothesis_title,
            "mechanism": hypothesis_mechanism
        },
        "pre_session_evidence_summary": pre_session_evidence[:3],
        "post_session_teacher_observations": post_session_observations[:10],
        "teacher_session_notes": session_notes[:500] if session_notes else ""
    }
    return (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"Session Data:\n{json.dumps(payload, indent=2, ensure_ascii=False)}\n\n"
        f"Return ONLY valid JSON matching this schema:\n"
        f"{json.dumps(OUTPUT_SCHEMA, indent=2)}"
    )
