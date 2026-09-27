import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    ClassroomDiagnosticOverview
)
from database import db
from ai_service import generate_learning_fingerprint_ai, GEMINI_API_KEY
from assessment_content import get_foundational_assessments
from diagnostic_engine import update_diagnostic_analysis_with_check

app = FastAPI(
    title="AI Learning Conductor - Phase 1 API",
    description="Evidence-based Foundational Literacy & Numeracy Assessment & Learning Map Engine",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "phase": "Phase 1: Assess & Build the Learning Map",
        "version": "1.0.0",
        "llm_engine": "Gemini-2.5-Flash (Active)" if GEMINI_API_KEY else "Deterministic Local AI Heuristic (Offline Active)",
        "total_classes": len(db.classes),
        "total_students": len(db.students)
    }

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

    return {"status": "override_recorded", "analysis": analysis}

@app.get("/api/classes/{class_id}/diagnostic-overview", response_model=ClassroomDiagnosticOverview)
async def get_classroom_diagnostic_overview(class_id: str):
    """
    Classroom Diagnostic Overview (Section 12, 19, 30):
    Clustered observed learning patterns across the classroom without dynamic grouping.
    """
    overview = db.get_classroom_diagnostics(class_id)
    return overview

