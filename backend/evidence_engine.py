from typing import List, Dict, Optional, Tuple, Any
from models import (
    ResponseItem,
    Observation,
    SkillEvidence,
    QuestionResultEvidence,
    DomainSkillsClassification,
    LearningFingerprint
)
from assessment_content import SKILL_DEFINITIONS

DEMONSTRATED_THRESHOLD = 0.80
EMERGING_THRESHOLD = 0.40

def compute_skill_evidence(
    responses: List[ResponseItem],
    domain: str,
    skill_definitions: List[Dict[str, str]]
) -> Tuple[List[SkillEvidence], DomainSkillsClassification]:
    """
    Computes strict, evidence-backed skill classifications without pedagogical guesswork.
    Rules:
    - Demonstrated: >= 80% accuracy
    - Emerging: >= 40% and < 80% accuracy
    - Not Yet Demonstrated: > 0 attempts and < 40% accuracy
    - Not Assessed: 0 attempts
    """
    evidence_list: List[SkillEvidence] = []
    classification = DomainSkillsClassification(
        demonstrated=[],
        emerging=[],
        not_yet_demonstrated=[],
        not_assessed=[]
    )

    domain_responses = [r for r in responses if r.domain == domain]

    for skill in skill_definitions:
        skill_id = skill["id"]
        skill_title = skill["title"]
        skill_responses = [r for r in domain_responses if r.skill_id == skill_id]

        total = len(skill_responses)
        correct = sum(1 for r in skill_responses if r.correct)
        percentage = round((correct / total) * 100, 1) if total > 0 else 0.0

        q_results = [
            QuestionResultEvidence(
                question_id=r.question_id,
                stimulus=r.expected_response if len(r.expected_response) < 15 else f"Item {r.question_id}",
                expected_response=r.expected_response,
                student_response=r.student_response,
                correct=r.correct,
                teacher_observation=r.teacher_observation
            )
            for r in skill_responses
        ]

        if total == 0:
            status = "not_assessed"
            classification.not_assessed.append(skill_id)
        elif (correct / total) >= DEMONSTRATED_THRESHOLD:
            status = "demonstrated"
            classification.demonstrated.append(skill_id)
        elif (correct / total) >= EMERGING_THRESHOLD:
            status = "emerging"
            classification.emerging.append(skill_id)
        else:
            status = "not_yet_demonstrated"
            classification.not_yet_demonstrated.append(skill_id)

        evidence_list.append(SkillEvidence(
            skill_id=skill_id,
            skill_title=skill_title,
            domain=domain,
            correct=correct,
            total=total,
            percentage=percentage,
            status=status,
            question_results=q_results
        ))

    return evidence_list, classification

def determine_confidence_level(total_attempts: int, total_skills_assessed: int) -> str:
    """
    Evaluates assessment coverage and evidence depth.
    High: >= 12 total items assessed covering at least 4 distinct skills
    Medium: 6 to 11 items assessed
    Low: < 6 items assessed
    """
    if total_attempts >= 12 and total_skills_assessed >= 4:
        return "High"
    elif total_attempts >= 6:
        return "Medium"
    return "Low"

def structure_teacher_observation(raw_obs: str) -> Dict[str, Any]:
    """
    Converts raw teacher notes into structured evidence types without psychiatric/disability speculation.
    Example: 'Student reads slowly' -> type: reading_fluency, note: 'slow reading pace'
    """
    text = raw_obs.lower()
    obs_type = "general_observation"
    tags = []

    if any(k in text for k in ["slow", "hesitant", "pause", "speed", "fluency", "वेगाने", "हळू"]):
        obs_type = "reading_fluency"
        tags.append("fluency_pacing")
    elif any(k in text for k in ["borrow", "carry", "regroup", "हाचा", "उणे", "स्थान"]):
        obs_type = "computation_method"
        tags.append("place_value_regrouping")
    elif any(k in text for k in ["sound", "letter", "phonics", "उच्चार", "ध्वनी"]):
        obs_type = "phonemic_awareness"
        tags.append("letter_sound_decoding")
    elif any(k in text for k in ["finger", "count", "mental", "बोटे", "मोजणी"]):
        obs_type = "counting_strategy"
        tags.append("concrete_finger_counting")
    elif any(k in text for k in ["confident", "shy", "distracted", "लक्ष", "उत्साही"]):
        obs_type = "engagement_behavior"
        tags.append("classroom_engagement")

    return {
        "observation_type": obs_type,
        "raw_text": raw_obs,
        "tags": tags,
        "source": "teacher"
    }

def generate_grounded_narrative(
    student_name: str,
    reading_evidence: List[SkillEvidence],
    numeracy_evidence: List[SkillEvidence],
    observations: List[str]
) -> str:
    """
    Creates an objective, evidence-grounded factual summary strictly based on recorded attempts.
    Never uses words like 'weak', 'disabled', or makes unsupported assumptions.
    """
    statements = []

    # Reading factual statements
    demo_read = [s.skill_title for s in reading_evidence if s.status == "demonstrated"]
    emerg_read = [s.skill_title for s in reading_evidence if s.status == "emerging"]
    not_read = [s.skill_title for s in reading_evidence if s.status == "not_yet_demonstrated"]

    if demo_read:
        statements.append(f"{student_name} demonstrated competency in {', '.join(demo_read)}.")
    if emerg_read:
        statements.append(f"{', '.join(emerg_read)} is currently emerging.")
    if not_read:
        statements.append(f"Tasks in {', '.join(not_read)} were not yet demonstrated during this session.")

    # Numeracy factual statements
    demo_num = [s.skill_title for s in numeracy_evidence if s.status == "demonstrated"]
    emerg_num = [s.skill_title for s in numeracy_evidence if s.status == "emerging"]
    not_num = [s.skill_title for s in numeracy_evidence if s.status == "not_yet_demonstrated"]

    if demo_num:
        statements.append(f"In numeracy, demonstrated mastery observed in {', '.join(demo_num)}.")
    if emerg_num:
        statements.append(f"Computational skills in {', '.join(emerg_num)} are emerging.")
    if not_num:
        statements.append(f"Tasks requiring {', '.join(not_num)} have not yet been demonstrated.")

    if observations:
        clean_obs = [o.strip() for o in observations if o.strip()]
        if clean_obs:
            statements.append(f"Teacher noted: {'; '.join(clean_obs[:3])}.")

    return " ".join(statements) if statements else f"Initial assessment started for {student_name}. Awaiting further evidence."
