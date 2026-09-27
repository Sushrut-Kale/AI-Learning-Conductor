"""
ai/prompts/fingerprint_summary.py
─────────────────────────────────
Prompt: FINGERPRINT_SUMMARY_V1
Version: 1
Phase: 1 — Assess & Build the Learning Map
Purpose: Synthesise a factual, evidence-grounded learner profile summary
         from teacher-recorded skill evidence and observations.

Allowed inputs:
  - student_name: str
  - grade: int
  - language: str
  - reading_evidence: list of {skill, correct, total, status}
  - numeracy_evidence: list of {skill, correct, total, status}
  - teacher_observations: list of str (raw text from teacher)

Expected output:
  - 2–3 sentence factual paragraph (plain text, no markdown)
  - Must reference specific skills and evidence counts
  - Must not diagnose, predict, rank, or label

Safety constraints:
  - No clinical/psychological terms
  - No disability labels
  - No ranking or comparison to peers
  - No lesson recommendations (Phase 2/3 scope)
  - Maximum 300 tokens
"""

PROMPT_NAME = "FINGERPRINT_SUMMARY"
PROMPT_VERSION = 1

SYSTEM_INSTRUCTION = (
    "You are an expert Foundational Learning Specialist writing an evidence-based learner profile summary. "
    "Your role is Phase 1: Assess & Build the Learning Map. "
    "\n\nSTRICT RULES:"
    "\n1. Cite specific evidence (e.g., '8 of 10 word-reading items correct')."
    "\n2. State which skills are Demonstrated, Emerging, or Not Yet Demonstrated."
    "\n3. NEVER diagnose learning disabilities (never use: dyslexia, dyscalculia, ADHD, disorder, impairment)."
    "\n4. NEVER recommend lessons or interventions — that is Phase 2/3 scope."
    "\n5. NEVER rank or compare this child to other children."
    "\n6. NEVER make claims about home environment, family, or socioeconomic status."
    "\n7. Tone must be calm, objective, professional, and respectful."
    "\n8. Output: 2–3 sentences only. Plain text. No markdown. No bullet points."
)

# Terms that trigger automatic output rejection
BLOCKED_OUTPUT_TERMS = [
    "disability", "disorder", "dyslexia", "dyscalculia", "adhd",
    "autism", "mentally", "inferior", "retarded", "slow learner",
    "cognitively", "neurological", "medical", "clinical",
    "family", "parent", "home", "poverty", "economic"
]

def build_prompt(
    student_name: str,
    grade: int,
    language: str,
    reading_evidence: list,
    numeracy_evidence: list,
    teacher_observations: list
) -> str:
    """Build the full prompt string for FINGERPRINT_SUMMARY_V1."""
    import json
    evidence_payload = {
        "student": student_name,
        "grade": grade,
        "assessment_language": language,
        "reading_evidence": reading_evidence,
        "numeracy_evidence": numeracy_evidence,
        "teacher_observations": teacher_observations[:10]  # cap to 10
    }
    return (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"Verified Evidence (do not invent any information not listed here):\n"
        f"{json.dumps(evidence_payload, indent=2, ensure_ascii=False)}\n\n"
        f"Return ONLY the 2-3 sentence factual summary. No preamble."
    )
