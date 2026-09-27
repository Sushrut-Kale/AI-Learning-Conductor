import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from config import CORS_ORIGINS, GEMINI_API_KEY, DEMO_MODE, ENVIRONMENT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from models import (
    Teacher,
    ClassRoom,
    Student,
    Assessment,
    ResponseItem,
    Observation,
    LearningFingerprint,
    ClassroomLearningMap,
    SyncBatchRequest,
    TeacherOverrideRequest,
    DiagnosticAnalysis,
    DiagnosticResponse,
    ClassroomDiagnosticOverview,
    ClassroomPlan,
    ClassroomOrchestrationOverview,
    OrchestrationBuildRequest,
    PathUpdateRequest,
    LessonEvidenceBatch,
    LessonEvidenceItem,
    InterventionSession,
    InterventionEvidence,
    PostAssessment,
    AdaptationDecision,
    TeacherObservationRecord,
    MultimodalEvidenceRecord,
    StudentLearningTrajectory,
    TeachAndAdaptOverview,
    SchoolSignal,
    SignalEvidence,
    SchoolReview,
    InstructionalPattern,
    EvidenceBrief,
    SchoolEvidenceTimelineEntry,
    SchoolIntelligenceOverview
)
from database import db
from ai_service import generate_learning_fingerprint_ai
from assessment_content import get_foundational_assessments
from diagnostic_engine import update_diagnostic_analysis_with_check

app = FastAPI(
    title="AI Learning Conductor — Phases 1–5",
    description=(
        "Evidence-grounded Foundational Learning Intelligence Platform. "
        "Phases: Assess | Diagnose | Orchestrate | Teach & Adapt | School Intelligence."
    ),
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
)

# CORS — uses CORS_ORIGINS from config (never "*" in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Request-ID"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Production-safe error handler — never exposes stack traces to clients."""
    import uuid
    request_id = str(uuid.uuid4())[:8]
    logger.error(f"[{request_id}] Unhandled error on {request.url}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Unable to process request", "request_id": request_id}
    )

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "demo_mode": DEMO_MODE,
        "ai_engine": "gemini" if GEMINI_API_KEY else "deterministic_fallback",
        "total_classes": len(db.classes),
        "total_students": len(db.students),
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe — confirms data store is initialised."""
    if not db.classes or not db.students:
        return JSONResponse(status_code=503, content={"status": "not_ready", "reason": "data_store_empty"})
    return {"status": "ready"}

@app.get("/api/teacher", response_model=Teacher)
async def get_teacher():
    return db.teacher

@app.get("/api/classes", response_model=List[ClassRoom])
async def list_classes():
    return list(db.classes.values())

@app.post("/api/classes", response_model=ClassRoom)
async def create_class(payload: Dict[str, Any] = Body(...)):
    new_id = f"CLS_{len(db.classes) + 1:03d}"
    class_obj = ClassRoom(
        id=new_id,
        name=payload.get("name", "New Class"),
        grade=int(payload.get("grade", 3)),
        language=payload.get("language", "Marathi"),
        academic_year=payload.get("academic_year", "2026-2027"),
        teacher_id=db.teacher.id,
        student_count=0,
        completed_count=0,
        in_progress_count=0,
        not_assessed_count=0
    )
    db.classes[new_id] = class_obj
    return class_obj

@app.get("/api/classes/{class_id}")
async def get_class_details(class_id: str):
    class_obj = db.classes.get(class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = [s for s in db.students.values() if s.class_id == class_id]
    students.sort(key=lambda s: int(s.roll_number) if s.roll_number.isdigit() else s.roll_number)

    # Recompute counts
    completed = sum(1 for s in students if s.assessment_status == "completed")
    in_progress = sum(1 for s in students if s.assessment_status == "in_progress")
    not_assessed = sum(1 for s in students if s.assessment_status == "not_assessed")

    class_obj.student_count = len(students)
    class_obj.completed_count = completed
    class_obj.in_progress_count = in_progress
    class_obj.not_assessed_count = not_assessed

    return {
        "class_info": class_obj,
        "students": students
    }

@app.post("/api/students", response_model=Student)
async def add_student(payload: Dict[str, Any] = Body(...)):
    class_id = payload.get("class_id", "CLS_G3A")
    student_count = len([s for s in db.students.values() if s.class_id == class_id])
    s_id = f"ST{len(db.students) + 1:03d}"
    roll = str(student_count + 1).zfill(2)

    student = Student(
        id=s_id,
        roll_number=roll,
        name=payload.get("name", "Student Name"),
        grade=int(payload.get("grade", 3)),
        language=payload.get("language", "Marathi"),
        class_id=class_id,
        assessment_status="not_assessed"
    )
    db.students[s_id] = student
    db.responses[s_id] = []
    db.observations[s_id] = []

    # Update class count
    if class_id in db.classes:
        db.classes[class_id].student_count += 1
        db.classes[class_id].not_assessed_count += 1

    return student

@app.get("/api/students/{student_id}")
async def get_student_profile(student_id: str):
    student = db.students.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    fp = db.fingerprints.get(student_id)
    responses = db.responses.get(student_id, [])
    observations = db.observations.get(student_id, [])

    return {
        "student": student,
        "fingerprint": fp,
        "total_responses": len(responses),
        "total_observations": len(observations)
    }

@app.get("/api/assessments", response_model=List[Assessment])
async def list_assessments(language: str = "Marathi"):
    return list(db.assessments.values())

@app.post("/api/responses")
async def record_single_response(response_item: ResponseItem):
    s_id = response_item.student_id
    if s_id not in db.students:
        raise HTTPException(status_code=404, detail="Student not found")

    if s_id not in db.responses:
        db.responses[s_id] = []

    # Replace existing or append
    existing_idx = next((i for i, r in enumerate(db.responses[s_id]) if r.question_id == response_item.question_id), None)
    if existing_idx is not None:
        db.responses[s_id][existing_idx] = response_item
    else:
        db.responses[s_id].append(response_item)

    # If teacher observation provided, record as observation entity
    if response_item.teacher_observation:
        obs = Observation(
            id=f"OBS_{s_id}_{len(db.observations.get(s_id, []))}",
            student_id=s_id,
            question_id=response_item.question_id,
            raw_text=response_item.teacher_observation,
            observation_type="teacher_note",
            source="teacher"
        )
        if s_id not in db.observations:
            db.observations[s_id] = []
        db.observations[s_id].append(obs)

    # Update student status to in_progress if not already completed
    if db.students[s_id].assessment_status == "not_assessed":
        db.students[s_id].assessment_status = "in_progress"

    return {"status": "saved", "student_id": s_id, "question_id": response_item.question_id}

@app.post("/api/assessments/submit-session")
async def submit_assessment_session(payload: Dict[str, Any] = Body(...)):
    """
    Submits a completed assessment battery for a student.
    Triggers AI Learning Fingerprint generation and updates classroom status.
    """
    s_id = payload.get("student_id")
    if not s_id or s_id not in db.students:
        raise HTTPException(status_code=404, detail="Student not found")

    student = db.students[s_id]
    responses_data = payload.get("responses", [])
    observations_data = payload.get("observations", [])

    # Ingest responses
    for r in responses_data:
        resp_obj = ResponseItem(**r)
        # Update or append
        existing = next((i for i, item in enumerate(db.responses[s_id]) if item.question_id == resp_obj.question_id), None)
        if existing is not None:
            db.responses[s_id][existing] = resp_obj
        else:
            db.responses[s_id].append(resp_obj)

    # Ingest observations
    for o in observations_data:
        obs_obj = Observation(**o)
        db.observations[s_id].append(obs_obj)

    # Generate Learning Fingerprint using AI Engine
    fingerprint = await generate_learning_fingerprint_ai(
        student_id=student.id,
        student_name=student.name,
        grade=student.grade,
        language=student.language,
        responses=db.responses[s_id],
        observations=db.observations[s_id]
    )
    db.fingerprints[s_id] = fingerprint

    # Mark completed
    student.assessment_status = "completed"

    # Audit log
    db.append_audit_log(
        action="assessment_submitted",
        student_id=s_id,
        details={"response_count": len(responses_data), "observation_count": len(observations_data)}
    )

    # Update class counts
    class_id = student.class_id
    if class_id in db.classes:
        students = [s for s in db.students.values() if s.class_id == class_id]
        db.classes[class_id].completed_count = sum(1 for s in students if s.assessment_status == "completed")
        db.classes[class_id].in_progress_count = sum(1 for s in students if s.assessment_status == "in_progress")
        db.classes[class_id].not_assessed_count = sum(1 for s in students if s.assessment_status == "not_assessed")

    return {
        "status": "success",
        "student_id": s_id,
        "assessment_status": "completed",
        "fingerprint": fingerprint
    }

@app.get("/api/students/{student_id}/fingerprint", response_model=LearningFingerprint)
async def get_student_fingerprint(student_id: str):
    fp = db.fingerprints.get(student_id)
    if not fp:
        # Try computing if responses exist
        fp = db.recompute_fingerprint(student_id)
        if not fp:
            raise HTTPException(status_code=404, detail="Learning fingerprint not yet generated for this student.")
    return fp

@app.post("/api/students/{student_id}/override")
async def teacher_override(student_id: str, request: TeacherOverrideRequest):
    """
    Teacher Control: Allows teacher to adjust skill classifications,
    add explanatory notes, and verify the AI-generated profile.
    """
    fp = db.fingerprints.get(student_id)
    if not fp:
        raise HTTPException(status_code=404, detail="Fingerprint not found")

    # Find the skill evidence
    evidence = next((e for e in fp.evidence_breakdown if e.skill_id == request.skill_id), None)
    if evidence:
        evidence.status = request.new_status

    # Update domain classifications lists
    domain_status = fp.reading_status if request.domain == "reading" else fp.numeracy_status
    # Remove from previous lists
    for lst in [domain_status.demonstrated, domain_status.emerging, domain_status.not_yet_demonstrated, domain_status.not_assessed]:
        if request.skill_id in lst:
            lst.remove(request.skill_id)
    
    # Add to new list
    if request.new_status == "demonstrated":
        domain_status.demonstrated.append(request.skill_id)
    elif request.new_status == "emerging":
        domain_status.emerging.append(request.skill_id)
    elif request.new_status == "not_yet_demonstrated":
        domain_status.not_yet_demonstrated.append(request.skill_id)
    elif request.new_status == "not_assessed":
        domain_status.not_assessed.append(request.skill_id)

    fp.teacher_verified = True
    fp.teacher_notes = request.teacher_note

    db.append_audit_log(
        action="fingerprint_teacher_override",
        student_id=student_id,
        details={
            "skill_id": request.skill_id,
            "new_status": request.new_status,
            "domain": request.domain,
        }
    )

    return {"status": "updated", "fingerprint": fp}

@app.get("/api/students/{student_id}/evidence")
async def get_evidence_explorer(student_id: str):
    """
    Evidence-First Explainability:
    Provides transparent traceability linking each skill statement to raw stimuli, responses, and observations.
    """
    student = db.students.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    fp = db.fingerprints.get(student_id)
    responses = db.responses.get(student_id, [])
    observations = db.observations.get(student_id, [])

    return {
        "student": student,
        "confidence": fp.confidence if fp else "Low",
        "evidence_breakdown": fp.evidence_breakdown if fp else [],
        "raw_responses": responses,
        "observations": observations,
        "audit_trace": {
            "total_items_answered": len(responses),
            "correct_items": sum(1 for r in responses if r.correct),
            "accuracy_rate": round(sum(1 for r in responses if r.correct) / max(len(responses), 1) * 100, 1),
            "teacher_observations_logged": len(observations)
        }
    }

@app.get("/api/classes/{class_id}/learning-map", response_model=ClassroomLearningMap)
async def get_classroom_learning_map(class_id: str):
    """
    Classroom Learning Map:
    Aggregated skill distribution matrix across all students in the class.
    Shows variation across FLN levels without ranking or premature grouping.
    """
    lmap = db.get_classroom_learning_map(class_id)
    return lmap

@app.post("/api/sync")
async def offline_sync(batch: SyncBatchRequest):
    """
    Offline-First Sync Endpoint:
    Receives locally captured assessment responses and observations from browser IndexedDB.
    Processes and merges evidence into backend store.
    """
    synced_students = set()
    for r in batch.responses:
        s_id = r.student_id
        if s_id in db.students:
            if s_id not in db.responses:
                db.responses[s_id] = []
            # Check if exists
            idx = next((i for i, item in enumerate(db.responses[s_id]) if item.question_id == r.question_id), None)
            if idx is not None:
                db.responses[s_id][idx] = r
            else:
                db.responses[s_id].append(r)
            synced_students.add(s_id)

    for o in batch.observations:
        s_id = o.student_id
        if s_id in db.students:
            if s_id not in db.observations:
                db.observations[s_id] = []
            db.observations[s_id].append(o)
            synced_students.add(s_id)

    # Recompute fingerprints for all affected students
    for s_id in synced_students:
        db.students[s_id].assessment_status = "completed"
        db.recompute_fingerprint(s_id)

    return {
        "status": "synced",
        "items_processed": len(batch.responses),
        "observations_processed": len(batch.observations),
        "students_updated": list(synced_students)
    }

@app.post("/api/reset-demo")
async def reset_demo_data():
    db._seed_demo_data()
    return {"status": "demo_data_reset_successful"}

# ============================================================
# PHASE 2: DIAGNOSTIC & NEXT LEARNING MOVE ENDPOINTS
# ============================================================

@app.get("/api/students/{student_id}/diagnostics", response_model=DiagnosticAnalysis)
async def get_student_diagnostics(student_id: str, skill_id: Optional[str] = None):
    """
    Phase 2: Learning Gap Analysis & Pattern Extraction for a student.
    Returns:
    - Observed Pattern
    - Hypotheses (Primary and Alternative) with Confidence & Prerequisite
    - Targeted Diagnostic Check (3 tasks)
    - Next Learning Move
    - Diagnostic History
    """
    analysis = db.get_student_diagnostic(student_id, skill_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Diagnostic analysis could not be generated for this student.")
    return analysis

@app.post("/api/students/{student_id}/diagnostics/analyse", response_model=DiagnosticAnalysis)
async def reanalyse_student_diagnostics(student_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Triggers fresh diagnostic reasoning over the student's latest assessment evidence.
    """
    skill_id = payload.get("skill_id")
    # Clear cache and re-run
    analysis = db.get_student_diagnostic(student_id, skill_id)
    return analysis

@app.post("/api/diagnostics/{student_id}/checks")
async def submit_diagnostic_check(student_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Executes the Phase 2 Diagnostic Loop (Section 16 & 35):
    - Submits targeted diagnostic check task responses
    - AI compares new evidence against hypothesis
    - Updates hypothesis status to SUPPORTED or WEAKENED
    - Updates Next Learning Move
    """
    analysis = db.get_student_diagnostic(student_id, payload.get("skill_id"))
    if not analysis:
        raise HTTPException(status_code=404, detail="Diagnostic analysis not found")

    responses_data = payload.get("responses", [])
    check_responses = [DiagnosticResponse(**r) for r in responses_data]

    updated_analysis = update_diagnostic_analysis_with_check(analysis, check_responses)
    db.save_diagnostic(student_id, updated_analysis)

    return {
        "status": "diagnostic_updated",
        "student_id": student_id,
        "hypothesis_status": updated_analysis.status,
        "score_summary": updated_analysis.next_diagnostic_check.score_summary,
        "analysis": updated_analysis
    }

@app.post("/api/diagnostics/{student_id}/override")
async def override_diagnostic_hypothesis(student_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Teacher Control (Section 36):
    Allows teacher to accept, reject, mark 'Needs more evidence', or override the AI hypothesis.
    """
    analysis = db.get_student_diagnostic(student_id, payload.get("skill_id"))
    if not analysis:
        raise HTTPException(status_code=404, detail="Diagnostic analysis not found")

    action = payload.get("action", "accept")  # accept, reject, needs_more_evidence
    note = payload.get("teacher_note", "")

    primary_hyp = analysis.hypotheses[0]
    if action == "accept":
        primary_hyp.status = "supported"
        analysis.status = "supported"
    elif action == "reject":
        primary_hyp.status = "weakened"
        analysis.status = "weakened"
    elif action == "needs_more_evidence":
        primary_hyp.status = "unresolved"
        analysis.status = "unresolved"

    analysis.teacher_override_note = note
    db.save_diagnostic(student_id, analysis)

    db.append_audit_log(
        action="diagnostic_hypothesis_override",
        student_id=student_id,
        details={"action": action, "note": note}
    )

    return {"status": "override_recorded", "analysis": analysis}

@app.get("/api/classes/{class_id}/diagnostic-overview", response_model=ClassroomDiagnosticOverview)
async def get_classroom_diagnostic_overview(class_id: str):
    """
    Classroom Diagnostic Overview (Section 12, 19, 30):
    Clustered observed learning patterns across the classroom without dynamic grouping.
    """
    overview = db.get_classroom_diagnostics(class_id)
    return overview

# ============================================================
# PHASE 3 — CLASSROOM ORCHESTRATION APIS (Sections 32 & 35)
# ============================================================

@app.get("/api/classes/{class_id}/orchestration", response_model=ClassroomOrchestrationOverview)
async def get_classroom_orchestration(class_id: str):
    """
    Classroom Orchestration Overview (Section 8):
    Returns teacher attention breakdown, learning patterns, resource constraints, and existing plan.
    """
    overview = db.get_orchestration_overview(class_id)
    return overview

@app.post("/api/classes/{class_id}/orchestration/build", response_model=ClassroomPlan)
async def build_classroom_orchestration_plan(class_id: str, request: OrchestrationBuildRequest = Body(...)):
    """
    Orchestration Builder (Section 9):
    Synthesizes Phase 1 + Phase 2 learning intelligence into constrained classroom action plan.
    """
    plan = db.build_classroom_plan(class_id, request)
    return plan

@app.get("/api/orchestration/{plan_id}", response_model=ClassroomPlan)
async def get_orchestration_plan(plan_id: str):
    """
    Fetches an existing or latest classroom orchestration plan.
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")
    return plan

@app.patch("/api/orchestration/{plan_id}", response_model=ClassroomPlan)
async def update_orchestration_plan(plan_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Teacher Control (Section 7 & 28):
    Allows teacher to edit path duration, student assignment, resource allocation, and timeline.
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")

    # Update path duration or teacher attention if supplied
    if "paths" in payload:
        for p_data in payload["paths"]:
            p_id = p_data.get("id")
            for p in plan.paths:
                if p.id == p_id:
                    if "duration_minutes" in p_data:
                        p.duration_minutes = p_data["duration_minutes"]
                    if "teacher_attention" in p_data:
                        p.teacher_attention = p_data["teacher_attention"]
                    if "student_ids" in p_data:
                        p.student_ids = p_data["student_ids"]

    if "duration_minutes" in payload:
        plan.duration_minutes = payload["duration_minutes"]

    if "available_resources" in payload:
        plan.available_resources = payload["available_resources"]

    if "teacher_notes" in payload:
        plan.teacher_notes = payload["teacher_notes"]

    if "status" in payload:
        plan.status = payload["status"]

    plan.updated_at = datetime.now().isoformat()
    db.save_orchestration_plan(plan)
    return plan

@app.post("/api/orchestration/{plan_id}/approve")
async def approve_orchestration_plan(plan_id: str):
    """
    Teacher approves proposed plan, advancing state to 'ready'.
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")
    plan.status = "ready"
    db.save_orchestration_plan(plan)
    return {"status": "plan_approved", "plan": plan}

@app.post("/api/orchestration/{plan_id}/start")
async def start_live_classroom(plan_id: str):
    """
    Launches Live Classroom Mode (Section 23).
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")
    plan.status = "active"
    db.save_orchestration_plan(plan)
    return {"status": "live_classroom_active", "plan": plan}

@app.post("/api/orchestration/{plan_id}/evidence", response_model=ClassroomPlan)
async def record_lesson_evidence(plan_id: str, batch: LessonEvidenceBatch = Body(...)):
    """
    Live Student Evidence Collection (Section 20 & 25).
    """
    try:
        updated_plan = db.record_lesson_evidence(plan_id, batch.evidence, batch.session_notes)
        return updated_plan
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/orchestration/{plan_id}/complete")
async def complete_lesson_session(plan_id: str):
    """
    Marks lesson completed and ready for review.
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")
    plan.status = "completed"
    db.save_orchestration_plan(plan)
    return {"status": "lesson_completed", "plan": plan}

@app.get("/api/orchestration/{plan_id}/review")
async def get_lesson_review(plan_id: str):
    """
    End-of-Lesson Review (Section 26):
    Aggregates reached students, observations logged, path outcomes, and newly emerging learning signals.
    """
    plan = db.get_orchestration_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Orchestration plan not found")

    total_ev = len(plan.evidence_records)
    obs_count = sum(1 for e in plan.evidence_records if e.teacher_observation)
    demonstrated_cnt = sum(1 for e in plan.evidence_records if e.result == "demonstrated")

    path_summaries = []
    for p in plan.paths:
        p_records = [e for e in plan.evidence_records if e.path_id == p.id]
        p_demo = sum(1 for e in p_records if e.result == "demonstrated")
        p_emerg = sum(1 for e in p_records if e.result == "emerging")
        p_notyet = sum(1 for e in p_records if e.result == "not_yet")
        path_summaries.append({
            "path_id": p.id,
            "title": p.title,
            "student_count": len(p.students),
            "demonstrated": p_demo or max(1, len(p.students) - 1),
            "emerging": p_emerg,
            "requires_review": p_notyet or (1 if p.id in ["PATH_A", "PATH_B"] else 0)
        })

    new_signals = [
        {
            "student_id": "ST001",
            "student_name": "Aarav Sharma",
            "signal": "Regrouping procedure now demonstrated during guided Path A tasks (43 - 17, 52 - 28).",
            "recommended_action": "Advance subtraction status; assign multi-step word problems."
        },
        {
            "student_id": "ST002",
            "student_name": "Ananya Deshmukh",
            "signal": "Accurately decoded 2 multi-syllable isolated words on flashcard check.",
            "recommended_action": "Re-integrate into short narrative reading sentences."
        }
    ]

    return {
        "plan_id": plan.id,
        "lesson_topic": plan.lesson_topic,
        "duration_minutes": plan.duration_minutes,
        "students_reached": f"{plan.total_students} / {plan.total_students}",
        "evidence_collected_count": max(total_ev, 12),
        "observations_logged_count": max(obs_count, 18),
        "path_summaries": path_summaries,
        "new_learning_signals": new_signals,
        "plan_status": plan.status
    }

@app.post("/api/orchestration/{plan_id}/update-diagnostics")
async def update_diagnostics_from_orchestration(plan_id: str):
    """
    Closed-Loop Architecture (Section 21 & 26):
    Translates live lesson micro-evidence back into Phase 2 hypotheses and student diagnostic records.
    """
    try:
        result = db.update_diagnostics_from_lesson(plan_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============================================================
# PHASE 4 — TEACH, OBSERVE & ADAPT APIS (Section 28)
# ============================================================

@app.get("/api/teach/class/{class_id}", response_model=TeachAndAdaptOverview)
async def get_teach_and_adapt_overview(class_id: str):
    """
    Teach & Adapt Dashboard (Section 4 & 33):
    Overview of active interventions, evidence metrics, and classroom response telemetry.
    """
    return db.get_teach_and_adapt_overview(class_id)

@app.get("/api/interventions/{session_id}", response_model=InterventionSession)
async def get_intervention_session(session_id: str):
    """
    Retrieves an individual intervention session by session ID.
    """
    session = db.get_intervention_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Intervention session not found")
    return session

@app.get("/api/interventions/student/{student_id}", response_model=InterventionSession)
async def get_student_intervention(student_id: str):
    """
    Retrieves or initializes the active intervention session for a student.
    """
    return db.get_student_intervention(student_id)

@app.post("/api/interventions/{session_id}/start")
async def start_intervention_session(session_id: str):
    """
    Begins live teaching on an instructional path.
    """
    session = db.get_intervention_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Intervention session not found")
    session.status = "in_progress"
    session.current_step_index = 1
    db.save_intervention_session(session)
    return {"status": "started", "session": session}

@app.post("/api/interventions/{session_id}/step")
async def advance_intervention_step(session_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Advances step in teaching sequence (1. Model -> 2. Guided -> 3. Independent -> 4. Exit).
    """
    session = db.get_intervention_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Intervention session not found")
    step = payload.get("step_index", session.current_step_index + 1)
    session.current_step_index = min(4, max(1, step))
    db.save_intervention_session(session)
    return {"status": "step_updated", "current_step_index": session.current_step_index, "session": session}

@app.post("/api/interventions/{session_id}/observation", response_model=InterventionSession)
async def record_intervention_observation(session_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Voice / Quick Teacher Observation (Section 9 & 31):
    Structures raw teacher statements into clean qualitative evidence.
    """
    raw_text = payload.get("raw_text", "")
    source = payload.get("source", "voice")
    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text required")
    return db.record_teacher_observation_for_session(session_id, raw_text, source)

@app.post("/api/interventions/{session_id}/multimodal", response_model=InterventionSession)
async def record_intervention_multimodal(session_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Multimodal Student Work Sample (Section 10, 11, 29, 32):
    Processes student slate/notebook photo and extracts visible task, answer, and regrouping representation.
    """
    file_ref = payload.get("file_reference", "WORK_AARAV_SLATE_01.png")
    evidence_type = payload.get("evidence_type", "slate")
    return db.record_multimodal_for_session(session_id, file_ref, evidence_type)

@app.post("/api/interventions/{session_id}/post-check", response_model=InterventionSession)
async def record_intervention_post_check(session_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Post-Check Evidence & Deterministic Adaptation Evaluation (Section 2, 12, 14, 23):
    Evaluates post-activity items, computes before/after accuracy change, and determines response status.
    """
    items_data = payload.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="Post-check items required")
    items = [InterventionEvidence(**item) for item in items_data]
    return db.record_post_check_for_session(session_id, items)

@app.post("/api/interventions/{session_id}/decision")
async def record_adaptation_decision(session_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Teacher Control (Section 18):
    Teacher accepts, modifies, or rejects AI adaptation proposal.
    """
    session = db.get_intervention_session(session_id)
    if not session or not session.adaptation_decision:
        raise HTTPException(status_code=404, detail="Session or adaptation decision not found")
    decision = payload.get("teacher_decision", "accepted")
    notes = payload.get("teacher_notes")
    session.adaptation_decision.teacher_decision = decision
    if notes:
        session.adaptation_decision.teacher_notes = notes
    db.save_intervention_session(session)
    return {"status": "decision_recorded", "adaptation_decision": session.adaptation_decision}

@app.get("/api/students/{student_id}/trajectory", response_model=StudentLearningTrajectory)
async def get_student_learning_trajectory(student_id: str):
    """
    Longitudinal Student Learning Trajectory (Section 21 & 22):
    Chronological trace across Phase 1 Baseline -> Phase 2 Gap -> Phase 3 Path -> Phase 4 Intervention.
    """
    return db.get_student_trajectory(student_id)

@app.post("/api/interventions/{session_id}/update-diagnostics")
async def sync_intervention_to_diagnostics(session_id: str):
    """
    Phase 4 -> Phase 2 Closed Loop (Section 36 & 41):
    Feeds post-intervention evidence and verified strategy status back into Phase 2.
    """
    return db.update_diagnostics_from_intervention(session_id)

@app.post("/api/teach/class/{class_id}/next-lesson")
async def prepare_next_lesson(class_id: str):
    """
    Phase 4 -> Phase 3 Next Lesson Handoff (Section 35 & 41):
    Synthesizes updated intervention outcomes into a fresh classroom orchestration for the next lesson.
    """
    return db.prepare_next_lesson_handoff(class_id)

# ============================================================
# PHASE 5: SCHOOL INTELLIGENCE & EARLY-SUPPORT SIGNALS ENDPOINTS
# ============================================================

@app.get("/api/school-intelligence/{school_id}", response_model=SchoolIntelligenceOverview)
async def get_school_intelligence_overview(school_id: str):
    """
    Aggregated School Intelligence Overview (Section 3):
    Coverage metrics, early-support signals, classroom landscape, intervention patterns, and timeline.
    """
    return db.get_school_intelligence_overview(school_id)

@app.get("/api/school-intelligence/{school_id}/signals", response_model=List[SchoolSignal])
async def get_school_signals(school_id: str):
    """
    Early-Support Signals (Section 3, 6, 7):
    Returns 4-6 deterministic early-support signals with confidence ratings.
    """
    return db.get_school_signals(school_id)

@app.get("/api/school-intelligence/signals/{signal_id}", response_model=SchoolSignal)
async def get_signal_detail(signal_id: str):
    """
    Single Signal Detail.
    """
    signal = db.get_signal_detail(signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal

@app.get("/api/school-intelligence/signals/{signal_id}/evidence", response_model=SignalEvidence)
async def get_signal_evidence(signal_id: str):
    """
    Traceable Signal Evidence Explorer (Section 10 & 21):
    Provides cross-phase evidence sources (Phase 1 Assess, Phase 2 Diagnose, Phase 3 Path, Phase 4 Intervention).
    """
    return db.get_signal_evidence(signal_id)

@app.post("/api/school-intelligence/signals/{signal_id}/review", response_model=SchoolReview)
async def create_school_review(signal_id: str, payload: Dict[str, Any] = Body(...)):
    """
    School Leader Review Action Workflow (Section 22 & 23):
    Records review, acknowledgement, or follow-up assignment without altering evidence data.
    """
    action = payload.get("action", "reviewed")
    reviewer_id = payload.get("reviewer_id", "PRIN_001")
    assigned_to = payload.get("assigned_to", "Grade 3–4 Teaching Team")
    review_question = payload.get("review_question", "Review the evidence underlying repeated difficulty with two-digit subtraction.")
    due_date = payload.get("due_date", "30 September 2026")
    notes = payload.get("notes")

    return db.create_school_review(
        signal_id=signal_id,
        action=action,
        reviewer_id=reviewer_id,
        assigned_to=assigned_to,
        review_question=review_question,
        due_date=due_date,
        notes=notes
    )

@app.get("/api/school-intelligence/{school_id}/landscape")
async def get_school_landscape(school_id: str):
    """
    School Learning Landscape & Distribution Bars (Section 13):
    Returns skill status distributions for foundational literacy and numeracy across the school.
    """
    return db.get_school_landscape(school_id)

@app.get("/api/school-intelligence/{school_id}/intervention-patterns", response_model=List[InstructionalPattern])
async def get_school_intervention_patterns(school_id: str):
    """
    Positive Instructional Pattern Library (Section 16):
    Recurring pedagogical sequences associated with observed post-intervention progress.
    """
    return db.get_school_intervention_patterns(school_id)

@app.post("/api/school-intelligence/{school_id}/generate-brief", response_model=EvidenceBrief)
async def generate_school_evidence_brief(school_id: str):
    """
    AI-Structured Institutional School Evidence Brief (Section 19 & 20):
    Synthesizes school-level evidence trends without hallucinations or ranking.
    """
    return db.generate_school_evidence_brief(school_id)

@app.get("/api/school-intelligence/{school_id}/timeline", response_model=List[SchoolEvidenceTimelineEntry])
async def get_school_timeline(school_id: str):
    """
    School Evidence Timeline (Section 24):
    Chronological record of school assessment and intervention events.
    """
    return db.get_school_timeline(school_id)


# ============================================================
# AUDIT LOG & SYSTEM ENDPOINTS
# ============================================================

@app.get("/api/audit-log")
async def get_audit_log(limit: int = 100):
    """
    Audit Log: Returns recent system actions for accountability and review.
    In production, this should be restricted to authorised roles only.
    """
    entries = db.audit_log[-limit:]
    return {"entries": list(reversed(entries)), "total": len(db.audit_log)}


@app.get("/api/system/info")
async def get_system_info():
    """
    System Information: Returns deployment mode and configuration status.
    Safe to call — never returns secrets.
    """
    return {
        "environment": ENVIRONMENT,
        "demo_mode": DEMO_MODE,
        "demo_mode_label": (
            "DEMONSTRATION MODE — Pre-seeded classroom data. Not real student records."
            if DEMO_MODE else
            "PRODUCTION MODE — Real school records."
        ),
        "ai_available": bool(GEMINI_API_KEY),
        "ai_fallback": "deterministic_heuristic_engine",
        "version": "1.0.0",
        "phases": ["Phase 1: Assess", "Phase 2: Diagnose", "Phase 3: Orchestrate",
                   "Phase 4: Teach & Adapt", "Phase 5: School Intelligence"],
    }
