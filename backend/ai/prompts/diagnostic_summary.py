"""
ai/prompts/diagnostic_summary.py
─────────────────────────────────
Prompt: DIAGNOSTIC_SUMMARY_V1
Version: 1
Phase: 2 — Diagnose & Find the Gap
Purpose: Generate a plausible learning-science hypothesis explaining an
         observed skill gap, based strictly on collected evidence.

Allowed inputs:
  - student_name: str (used only for readable output, not for identification)
  - gap_skill: str
  - prerequisite_chain: list of str
  - demonstrated_prerequisites: list of str
  - missing_prerequisites: list of str
  - evidence_examples: list of str (specific item-level observations)

Expected output:
  - Primary hypothesis: {title, mechanism, confidence_label}
  - 2 alternative hypotheses: [{title, mechanism}]
  - Suggested diagnostic check: str

Safety constraints:
  - Hypotheses must be observable/pedagogical — not clinical
  - Must state confidence as Low / Moderate / High based on evidence count
  - No disability labels
  - Maximum 500 tokens
"""

PROMPT_NAME = "DIAGNOSTIC_SUMMARY"
PROMPT_VERSION = 1

SYSTEM_INSTRUCTION = (
    "You are a Foundational Learning Diagnostic Specialist. "
    "A classroom teacher has observed a specific skill gap in a student. "
    "Your role is to generate evidence-grounded, pedagogical hypotheses — not clinical diagnoses. "
    "\n\nSTRICT RULES:"
    "\n1. Hypotheses must describe observable learning patterns, NOT medical or psychological conditions."
    "\n2. NEVER use: dyslexia, dyscalculia, ADHD, disability, disorder, impairment, condition."
    "\n3. Each hypothesis must reference the specific evidence provided."
    "\n4. Confidence must be: 'Low' (1-2 evidence items), 'Moderate' (3-5), or 'High' (6+)."
    "\n5. The diagnostic check must be a concrete classroom action the teacher can perform in 5 minutes."
    "\n6. Output must be valid JSON matching the schema exactly."
)

OUTPUT_SCHEMA = {
    "primary_hypothesis": {
        "title": "string (max 60 chars)",
        "mechanism": "string (1-2 sentences explaining the pedagogical pattern)",
        "confidence_label": "Low | Moderate | High"
    },
    "alternative_hypotheses": [
        {"title": "string", "mechanism": "string"}
    ],
    "suggested_diagnostic_check": "string (specific classroom action)"
}

BLOCKED_OUTPUT_TERMS = [
    "dyslexia", "dyscalculia", "adhd", "autism", "disability",
    "disorder", "impairment", "condition", "neurological", "medical",
    "clinical", "cognitive deficit", "intelligence"
]

def build_prompt(
    student_name: str,
    gap_skill: str,
    prerequisite_chain: list,
    demonstrated_prerequisites: list,
    missing_prerequisites: list,
    evidence_examples: list,
    evidence_count: int
) -> str:
    import json
    payload = {
        "gap_skill": gap_skill,
        "prerequisite_chain": prerequisite_chain,
        "demonstrated_prerequisites": demonstrated_prerequisites,
        "missing_prerequisites": missing_prerequisites,
        "specific_evidence": evidence_examples[:5],
        "total_evidence_items": evidence_count
    }
    confidence = "Low" if evidence_count <= 2 else ("Moderate" if evidence_count <= 5 else "High")
    return (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"Evidence (evidence_count={evidence_count}, confidence_label='{confidence}'):\n"
        f"{json.dumps(payload, indent=2, ensure_ascii=False)}\n\n"
        f"Return ONLY valid JSON matching this schema:\n"
        f"{json.dumps(OUTPUT_SCHEMA, indent=2)}"
    )
