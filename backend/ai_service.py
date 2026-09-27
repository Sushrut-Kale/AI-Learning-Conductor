"""
ai_service.py — Hardened AI Service for AI Learning Conductor

Architecture:
  Deterministic Evidence Engine (always runs)
      ↓
  AI enrichment (if Gemini available & not rate-limited)
      ↓
  Output validation (Pydantic + blocklist)
      ↓
  Fallback to deterministic result if validation fails

AI is NEVER a single point of failure.
"""
import os
import json
import asyncio
import logging
from typing import List, Optional

import httpx
from pydantic import BaseModel, validator

from config import (
    GEMINI_API_KEY, GEMINI_MODEL,
    AI_TIMEOUT_SECONDS, AI_MAX_RETRIES, AI_MAX_OUTPUT_TOKENS
)
from models import ResponseItem, Observation, LearningFingerprint, SkillEvidence
from assessment_content import SKILL_DEFINITIONS
from evidence_engine import (
    compute_skill_evidence,
    determine_confidence_level,
    structure_teacher_observation,
    generate_grounded_narrative,
)
from ai.prompts.fingerprint_summary import (
    build_prompt as build_fingerprint_prompt,
    BLOCKED_OUTPUT_TERMS as FINGERPRINT_BLOCKED_TERMS,
    PROMPT_NAME as FINGERPRINT_PROMPT_NAME,
    PROMPT_VERSION as FINGERPRINT_PROMPT_VERSION,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Pydantic models for validated AI outputs
# ─────────────────────────────────────────────────────────────

class AIFingerprintSummary(BaseModel):
    """Validated output for Phase 1 fingerprint narrative."""
    narrative: str

    @validator("narrative")
    def narrative_must_be_safe(cls, v: str) -> str:
        text_lower = v.lower()
        for term in FINGERPRINT_BLOCKED_TERMS:
            if term in text_lower:
                raise ValueError(f"AI output contains blocked term: '{term}'")
        if len(v) > 1200:
            raise ValueError("AI output exceeds maximum allowed length")
        if len(v.strip()) < 20:
            raise ValueError("AI output too short to be meaningful")
        return v.strip()


# ─────────────────────────────────────────────────────────────
# Core Gemini caller — with timeout, retry, and validation
# ─────────────────────────────────────────────────────────────

async def _call_gemini(
    prompt: str,
    max_tokens: int = AI_MAX_OUTPUT_TOKENS,
    temperature: float = 0.2,
    context: str = "unknown"
) -> Optional[str]:
    """
    Low-level Gemini API call with timeout and retry.
    Returns raw text or None on any failure.
    Logs failures with context for observability.
    Never raises exceptions to callers.
    """
    if not GEMINI_API_KEY:
        logger.debug("[AI] No GEMINI_API_KEY configured — using deterministic fallback")
        return None

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_LOW_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_LOW_AND_ABOVE"},
        ]
    }

    for attempt in range(1, AI_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
                res = await client.post(url, json=payload)

            if res.status_code == 429:
                logger.warning(f"[AI:{context}] Rate limited (attempt {attempt}/{AI_MAX_RETRIES})")
                if attempt < AI_MAX_RETRIES:
                    await asyncio.sleep(2 ** attempt)
                continue

            if res.status_code != 200:
                logger.warning(
                    f"[AI:{context}] Unexpected status {res.status_code} (attempt {attempt})"
                )
                continue

            data = res.json()
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning(f"[AI:{context}] Empty candidates in response")
                return None

            text = (
                candidates[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
            if text:
                logger.info(f"[AI:{context}] Success on attempt {attempt} — {GEMINI_MODEL}")
                return text

        except httpx.TimeoutException:
            logger.warning(f"[AI:{context}] Timeout after {AI_TIMEOUT_SECONDS}s (attempt {attempt})")
        except Exception as e:
            logger.error(f"[AI:{context}] Unexpected error: {type(e).__name__}: {e} (attempt {attempt})")

    logger.info(f"[AI:{context}] All {AI_MAX_RETRIES} attempts failed — using deterministic fallback")
    return None


# ─────────────────────────────────────────────────────────────
# Phase 1 — Learning Fingerprint AI enrichment
# ─────────────────────────────────────────────────────────────

async def generate_learning_fingerprint_ai(
    student_id: str,
    student_name: str,
    grade: int,
    language: str,
    responses: List[ResponseItem],
    observations: List[Observation],
) -> LearningFingerprint:
    """
    Generates a Learning Fingerprint.
    1. Deterministic computation (always runs, never fails)
    2. AI enrichment (optional, validated, falls back on failure)
    """
    # Step 1: Deterministic ground truth
    read_ev, read_class = compute_skill_evidence(responses, "reading", SKILL_DEFINITIONS["reading"])
    num_ev, num_class = compute_skill_evidence(responses, "numeracy", SKILL_DEFINITIONS["numeracy"])
    all_evidence = read_ev + num_ev

    total_attempts = len(responses)
    skills_assessed = sum(1 for e in all_evidence if e.status != "not_assessed")
    confidence = determine_confidence_level(total_attempts, skills_assessed)

    # Step 2: Collect and structure observations
    obs_texts = [o.raw_text for o in observations if o.raw_text.strip()]
    for r in responses:
        if r.teacher_observation and r.teacher_observation.strip():
            obs_texts.append(r.teacher_observation.strip())
    unique_obs = list(dict.fromkeys(obs_texts))
    structured_obs = [structure_teacher_observation(o) for o in unique_obs]

    # Step 3: Deterministic narrative (baseline — always available)
    baseline_narrative = generate_grounded_narrative(student_name, read_ev, num_ev, unique_obs)
    final_narrative = baseline_narrative
    ai_assisted = False

    # Step 4: AI enrichment (optional)
    if GEMINI_API_KEY:
        prompt = build_fingerprint_prompt(
            student_name=student_name,
            grade=grade,
            language=language,
            reading_evidence=[
                {"skill": e.skill_title, "correct": e.correct, "total": e.total, "status": e.status}
                for e in read_ev if e.total > 0
            ],
            numeracy_evidence=[
                {"skill": e.skill_title, "correct": e.correct, "total": e.total, "status": e.status}
                for e in num_ev if e.total > 0
            ],
            teacher_observations=unique_obs,
        )
        raw_text = await _call_gemini(
            prompt=prompt,
            max_tokens=300,
            temperature=0.2,
            context=f"fingerprint/{student_id}"
        )
        if raw_text:
            try:
                validated = AIFingerprintSummary(narrative=raw_text)
                final_narrative = validated.narrative
                ai_assisted = True
                logger.info(f"[AI] Fingerprint narrative validated for {student_id} "
                            f"[prompt={FINGERPRINT_PROMPT_NAME}_V{FINGERPRINT_PROMPT_VERSION}]")
            except Exception as validation_error:
                logger.warning(
                    f"[AI] Fingerprint output rejected for {student_id}: {validation_error} "
                    f"— using deterministic fallback"
                )

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
        teacher_notes=None,
    )

    return fingerprint
