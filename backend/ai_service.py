import os
import json
import httpx
from typing import List, Dict, Any, Optional
from models import (
    ResponseItem,
    Observation,
    LearningFingerprint,
    SkillEvidence
)
from assessment_content import SKILL_DEFINITIONS
from evidence_engine import (
    compute_skill_evidence,
    determine_confidence_level,
    structure_teacher_observation,
    generate_grounded_narrative
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

async def generate_learning_fingerprint_ai(
    student_id: str,
    student_name: str,
    grade: int,
    language: str,
    responses: List[ResponseItem],
    observations: List[Observation]
) -> LearningFingerprint:
    """
    Synthesizes the Phase 1 Learning Fingerprint.
    Uses LLM when available for structuring natural language teacher notes and concise factual synthesis,
    with strict programmatic grounding against ground-truth response tables.
    """
    # 1. Deterministic Ground Truth Computation
    read_ev, read_class = compute_skill_evidence(responses, "reading", SKILL_DEFINITIONS["reading"])
    num_ev, num_class = compute_skill_evidence(responses, "numeracy", SKILL_DEFINITIONS["numeracy"])
    all_evidence = read_ev + num_ev

    total_attempts = len(responses)
    skills_assessed = sum(1 for e in all_evidence if e.status != "not_assessed")
    confidence = determine_confidence_level(total_attempts, skills_assessed)

    # 2. Structure Observations
    obs_texts = [o.raw_text for o in observations if o.raw_text.strip()]
    for r in responses:
        if r.teacher_observation and r.teacher_observation.strip():
            obs_texts.append(r.teacher_observation.strip())

    unique_obs = list(dict.fromkeys(obs_texts))
    structured_obs = [structure_teacher_observation(o) for o in unique_obs]

    # Baseline Grounded Narrative
    baseline_narrative = generate_grounded_narrative(student_name, read_ev, num_ev, unique_obs)
    final_narrative = baseline_narrative

    # 3. Optional LLM Structuring & Polishing (if GEMINI_API_KEY is present)
    if GEMINI_API_KEY:
        try:
            llm_narrative = await _call_gemini_structurer(
                student_name=student_name,
                grade=grade,
                language=language,
                reading_evidence=read_ev,
                numeracy_evidence=num_ev,
                observations=unique_obs
            )
            if llm_narrative:
                final_narrative = llm_narrative
        except Exception as e:
            print(f"[AI Service] Gemini fallback used due to: {e}")
            final_narrative = baseline_narrative

    fingerprint = LearningFingerprint(
        id=f"FP_{student_id}",
        student_id=student_id,
        student_name=student_name,
        grade=grade,
        language=language,
        assessment_date=responses[-1].timestamp[:10] if responses else "2026-09-27",
        confidence=confidence,
        reading_status=read_class,
        numeracy_status=num_class,
        evidence_breakdown=all_evidence,
        teacher_observations_summary=unique_obs,
        structured_observations=structured_obs,
        ai_summary_narrative=final_narrative,
        teacher_verified=False,
        teacher_notes=None
    )

    return fingerprint

async def _call_gemini_structurer(
    student_name: str,
    grade: int,
    language: str,
    reading_evidence: List[SkillEvidence],
    numeracy_evidence: List[SkillEvidence],
    observations: List[str]
) -> Optional[str]:
    """
    Calls Gemini API with strict instruction:
    - Never invent diagnoses or disability
    - Never predict future or label child
    - Summarize strictly based on verified evidence provided
    """
    evidence_payload = {
        "student": student_name,
        "grade": grade,
        "language": language,
        "reading_evidence": [
            {"skill": e.skill_title, "correct": e.correct, "total": e.total, "status": e.status}
            for e in reading_evidence if e.total > 0
        ],
        "numeracy_evidence": [
            {"skill": e.skill_title, "correct": e.correct, "total": e.total, "status": e.status}
            for e in numeracy_evidence if e.total > 0
        ],
        "teacher_observations": observations
    }

    system_instruction = (
        "You are an expert Foundational Learning Specialist in Phase 1 (Assess & Map). "
        "Your task is to generate a concise, 2-to-3 sentence factual learner profile summary. "
        "RULES: "
        "1. Strictly cite the provided evidence (e.g. '8 of 10 words correct'). "
        "2. State what skills are Demonstrated, Emerging, or Not Yet Demonstrated. "
        "3. DO NOT diagnose learning disabilities (e.g., NEVER say dyslexia, dyscalculia, ADHD). "
        "4. DO NOT recommend lessons, worksheets, or interventions (that is Phase 2/3). "
        "5. DO NOT rank or compare to other children. "
        "6. Tone must be calm, objective, educational, and respectful."
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"Verified Evidence:\n{json.dumps(evidence_payload, indent=2)}\n\n"
        f"Return ONLY the concise factual summary paragraph."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 200
        }
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                # Anti-hallucination safety filter: verify no banned labels
                banned_words = ["disability", "disorder", "dyslexia", "dyscalculia", "adhd", "mentally", "inferior", "retarded"]
                if any(w in text.lower() for w in banned_words):
                    return None
                return text.strip()
    return None
