from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class Teacher(BaseModel):
    id: str
    name: str
    email: str
    school_name: str = "Pratham Adarsh Vidyalaya"

class ClassRoom(BaseModel):
    id: str
    name: str  # e.g., "Grade 3 — Section A"
    grade: int
    language: str  # e.g., "Marathi", "Hindi", "English"
    academic_year: str = "2026-2027"
    teacher_id: str = "TCH001"
    student_count: int = 0
    completed_count: int = 0
    in_progress_count: int = 0
    not_assessed_count: int = 0

class Student(BaseModel):
    id: str
    roll_number: str
    name: str
    grade: int
    language: str
    class_id: str
    assessment_status: Literal["completed", "in_progress", "not_assessed"] = "not_assessed"
    avatar_color: str = "#4F46E5"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class AssessmentItem(BaseModel):
    id: str
    assessment_id: str
    domain: Literal["reading", "numeracy"]
    skill_id: str
    skill_title: str
    question_stimulus: str
    stimulus_type: Literal["letter", "word", "sentence", "paragraph", "comprehension", "number", "comparison", "addition", "subtraction", "multiplication"]
    expected_response: str
    options: Optional[List[str]] = None
    instructions_for_teacher: str
    difficulty_level: int = 1

class Assessment(BaseModel):
    id: str
    title: str
    grade: int
    language: str
    domain: Literal["reading", "numeracy"]
    framework: str = "Foundational Literacy & Numeracy (ASER / CBSE FLN Inspired)"
    skills: List[Dict[str, str]]
    items: List[AssessmentItem] = []

class ResponseItem(BaseModel):
    id: str
    student_id: str
    assessment_id: str
    question_id: str
    skill_id: str
    domain: Literal["reading", "numeracy"]
    expected_response: str
    student_response: str
    correct: bool
    response_time_seconds: Optional[float] = None
    teacher_observation: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class Observation(BaseModel):
    id: str
    student_id: str
    question_id: Optional[str] = None
    raw_text: str
    observation_type: str  # e.g. "reading_fluency", "computation_method", "phonemic_awareness", "focus"
    structured_content: Dict[str, Any] = {}
    source: Literal["teacher", "voice"] = "teacher"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class QuestionResultEvidence(BaseModel):
    question_id: str
    stimulus: str
    expected_response: str
    student_response: str
    correct: bool
    teacher_observation: Optional[str] = None

class SkillEvidence(BaseModel):
    skill_id: str
    skill_title: str
    domain: Literal["reading", "numeracy"]
    correct: int
    total: int
    percentage: float
    status: Literal["demonstrated", "emerging", "not_yet_demonstrated", "not_assessed"]
    question_results: List[QuestionResultEvidence] = []

class DomainSkillsClassification(BaseModel):
    demonstrated: List[str] = []
    emerging: List[str] = []
    not_yet_demonstrated: List[str] = []
    not_assessed: List[str] = []

class LearningFingerprint(BaseModel):
    id: str
    student_id: str
    student_name: str
    grade: int
    language: str
    assessment_date: str
    confidence: Literal["High", "Medium", "Low"]
    reading_status: DomainSkillsClassification
    numeracy_status: DomainSkillsClassification
    evidence_breakdown: List[SkillEvidence] = []
    teacher_observations_summary: List[str] = []
    structured_observations: List[Dict[str, Any]] = []
    ai_summary_narrative: str
    teacher_verified: bool = False
    teacher_notes: Optional[str] = None
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class SkillDistribution(BaseModel):
    skill_id: str
    skill_title: str
    domain: Literal["reading", "numeracy"]
    demonstrated_count: int = 0
    emerging_count: int = 0
    not_yet_count: int = 0
    not_assessed_count: int = 0
    students_demonstrated: List[str] = []
    students_emerging: List[str] = []
    students_not_yet: List[str] = []
    students_not_assessed: List[str] = []

class ClassroomLearningMap(BaseModel):
    class_id: str
    class_name: str
    grade: int
    language: str
    total_students: int
    assessed_count: int
    in_progress_count: int
    not_assessed_count: int
    reading_matrix: List[SkillDistribution]
    numeracy_matrix: List[SkillDistribution]
    summary_insight: str

class SyncBatchRequest(BaseModel):
    responses: List[ResponseItem]
    observations: List[Observation]
    client_timestamp: str

class TeacherOverrideRequest(BaseModel):
    student_id: str
    skill_id: str
    domain: Literal["reading", "numeracy"]
    new_status: Literal["demonstrated", "emerging", "not_yet_demonstrated", "not_assessed"]
    teacher_note: str

# ============================================================
# PHASE 2: DIAGNOSTIC & NEXT LEARNING MOVE DATA MODELS
# ============================================================

class DiagnosticCheckTask(BaseModel):
    id: str
    prompt: str
    expected_response: str
    instructions_for_teacher: str
    prerequisite_skill: str

class DiagnosticResponse(BaseModel):
    task_id: str
    student_response: str
    correct: bool
    teacher_observation: Optional[str] = None

class DiagnosticCheck(BaseModel):
    id: str
    hypothesis_id: str
    prerequisite_skill: str
    purpose: str
    tasks: List[DiagnosticCheckTask] = []
    status: Literal["pending", "completed"] = "pending"
    responses: List[DiagnosticResponse] = []
    score_summary: Optional[str] = None

class EvidencePattern(BaseModel):
    id: str
    description: str
    evidence_summary: str
    supporting_task_ids: List[str] = []
    successful_task_ids: List[str] = []
    failed_task_ids: List[str] = []
    teacher_observations: List[str] = []

class Hypothesis(BaseModel):
    id: str
    hypothesis_type: Literal["primary", "alternative"] = "primary"
    description: str
    confidence: Literal["High", "Medium", "Low"] = "Medium"
    confidence_rationale: str = ""
    status: Literal["open", "supported", "weakened", "unresolved"] = "open"
    prerequisite_skill: str
    supporting_evidence: List[str] = []
    evidence_needed_to_confirm: str = ""

class NextLearningMove(BaseModel):
    id: str
    description: str
    rationale: str
    prerequisite_focus: str
    instructional_step: str

class DiagnosticHistoryEntry(BaseModel):
    timestamp: str
    event: str
    previous_status: str
    updated_status: str
    evidence_added: str
    interpretation: str

class DiagnosticAnalysis(BaseModel):
    id: str
    student_id: str
    student_name: str
    skill_id: str
    skill_title: str
    domain: Literal["reading", "numeracy"]
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: Literal["open", "supported", "weakened", "unresolved"] = "open"
    observed_performance: str
    observed_pattern: EvidencePattern
    hypotheses: List[Hypothesis] = []
    next_diagnostic_check: DiagnosticCheck
    next_learning_move: NextLearningMove
    diagnostic_history: List[DiagnosticHistoryEntry] = []
    teacher_override_note: Optional[str] = None

class ClassroomDiagnosticPattern(BaseModel):
    pattern_id: str
    skill_id: str
    skill_title: str
    domain: Literal["reading", "numeracy"]
    pattern_summary: str
    student_count: int
    students: List[Dict[str, str]] = []
    potential_shared_prerequisite: str
    recommended_diagnostic_focus: str

class ClassroomDiagnosticOverview(BaseModel):
    class_id: str
    class_name: str
    grade: int
    students_reviewed: int
    students_requiring_review: int
    patterns: List[ClassroomDiagnosticPattern] = []
    summary_guidance: str

# ============================================================
# PHASE 3 — CLASSROOM ORCHESTRATION MODELS
# ============================================================

class ClassroomActivity(BaseModel):
    start_activity: str
    guided_activity: str
    independent_activity: str
    exit_activity: str
    materials_needed: List[str] = []

class PathMembership(BaseModel):
    student_id: str
    student_name: str
    current_focus: str
    hypothesis_status: str
    next_learning_move: str
    evidence_basis: str
    locked: bool = False

class TeacherAttentionAllocation(BaseModel):
    path_id: str
    allocated_minutes: int
    priority: Literal["required", "recommended", "quick_check", "independent"]
    rationale: str

class InstructionalPath(BaseModel):
    id: str
    title: str
    learning_focus: str
    domain: Literal["numeracy", "reading", "general"]
    teacher_attention: Literal["required", "recommended", "quick_check", "independent"]
    duration_minutes: int
    student_ids: List[str] = []
    students: List[PathMembership] = []
    rationale: str
    next_learning_move: str
    activity: ClassroomActivity
    exit_task_ids: List[str] = []

class LessonSegment(BaseModel):
    id: str
    start_minute: int
    end_minute: int
    title: str
    segment_type: Literal["whole_class", "teacher_focus", "quick_check", "peer_supported", "independent", "exit_evidence"]
    active_path_id: Optional[str] = None
    teacher_role: str
    class_activity: str
    students_involved_count: int

class LessonEvidenceItem(BaseModel):
    student_id: str
    student_name: str
    path_id: str
    task_id: str
    result: Literal["demonstrated", "emerging", "not_yet", "not_observed"]
    strategy_tags: List[str] = []
    teacher_observation: Optional[str] = None
    timestamp: Optional[str] = None

class ClassroomPlan(BaseModel):
    id: str
    class_id: str
    class_name: str
    grade: int
    lesson_topic: str
    total_students: int
    duration_minutes: int = 40
    available_resources: List[str] = ["Blackboard", "Textbook", "Notebook", "Printed worksheet"]
    status: Literal["draft", "ready", "active", "completed", "review"] = "ready"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    paths: List[InstructionalPath] = []
    timeline: List[LessonSegment] = []
    teacher_attention_budget: Dict[str, Any] = {}
    evidence_records: List[LessonEvidenceItem] = []
    teacher_notes: Optional[str] = None

class ClassroomOrchestrationOverview(BaseModel):
    class_id: str
    class_name: str
    grade: int
    lesson_topic: str
    duration_minutes: int
    total_students: int
    patterns_summary: List[Dict[str, Any]] = []
    attention_breakdown: Dict[str, int] = {}
    existing_plan: Optional[ClassroomPlan] = None
    available_resources: List[str] = []

class OrchestrationBuildRequest(BaseModel):
    lesson_topic: Optional[str] = "Two-Digit Subtraction"
    duration_minutes: Optional[int] = 40
    available_resources: Optional[List[str]] = None
    custom_priorities: Optional[Dict[str, str]] = None

class PathUpdateRequest(BaseModel):
    duration_minutes: Optional[int] = None
    teacher_attention: Optional[str] = None
    student_ids: Optional[List[str]] = None
    activity_notes: Optional[str] = None

class LessonEvidenceBatch(BaseModel):
    plan_id: str
    evidence: List[LessonEvidenceItem]
    session_notes: Optional[str] = None

# ============================================================
# PHASE 4 — TEACH, OBSERVE & ADAPT MODELS
# ============================================================

class InterventionEvidence(BaseModel):
    id: str
    task_id: str
    task_prompt: str
    student_response: str
    expected_response: str
    correct: bool
    source: Literal["teacher_observation", "post_check", "voice", "multimodal"] = "post_check"
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))

class PostAssessment(BaseModel):
    id: str
    correct_count: int
    total_count: int
    accuracy_percentage: float
    items: List[InterventionEvidence] = []
    completed_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class AdaptationDecision(BaseModel):
    id: str
    response_status: Literal[
        "SUPPORTED_PROGRESS",
        "CONTINUED_DIFFICULTY",
        "PARTIAL_RESPONSE",
        "INSUFFICIENT_EVIDENCE",
        "NEW_PATTERN"
    ]
    action_type: Literal["CONTINUE", "ADJUST", "INVESTIGATE"]
    description: str
    rationale: str
    baseline_accuracy: float
    post_accuracy: float
    accuracy_change_points: float
    observed_change_summary: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
    teacher_decision: Literal["accepted", "modified", "rejected", "pending"] = "pending"
    teacher_notes: Optional[str] = None

class TeacherObservationRecord(BaseModel):
    id: str
    raw_text: str
    structured_observation: Dict[str, Any] = {}
    source: Literal["voice", "quick_note", "copilot"] = "voice"
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))

class MultimodalEvidenceRecord(BaseModel):
    id: str
    file_reference: str = ""
    evidence_type: str = "slate"
    task_id: str
    visible_task: str
    written_answer: str
    regrouping_representation_visible: bool = True
    extracted_observation: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
    teacher_verified: bool = True
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))

class StudentTrajectoryEntry(BaseModel):
    timestamp: str
    phase: str
    title: str
    metric_or_status: str
    detail: str
    evidence_trace_id: Optional[str] = None

class StudentLearningTrajectory(BaseModel):
    student_id: str
    student_name: str
    skill_id: str
    skill_title: str
    baseline_evidence: str
    diagnostic_hypothesis: str
    instructional_path_title: str
    intervention_evidence: str
    current_response_status: str
    next_learning_move: str
    timeline: List[StudentTrajectoryEntry] = []

class InterventionSession(BaseModel):
    id: str
    class_id: str
    path_id: str
    path_title: str
    student_id: str
    student_name: str
    skill_id: str
    skill_title: str
    started_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    status: Literal["in_progress", "completed", "review"] = "in_progress"
    current_step_index: int = 1  # 1: Model, 2: Guided, 3: Independent, 4: Exit
    baseline_correct: int = 2
    baseline_total: int = 5
    baseline_accuracy: float = 40.0
    post_assessment: Optional[PostAssessment] = None
    adaptation_decision: Optional[AdaptationDecision] = None
    observations: List[TeacherObservationRecord] = []
    multimodal_records: List[MultimodalEvidenceRecord] = []

class ClassroomAdaptationSummary(BaseModel):
    class_id: str
    lesson_topic: str
    total_interventions: int
    completed_count: int
    evidence_collected_count: int
    supported_progress_count: int
    partial_response_count: int
    further_check_count: int
    insufficient_evidence_count: int
    path_response_breakdowns: List[Dict[str, Any]] = []
    recommended_next_actions: Dict[str, int] = {}

class TeachAndAdaptOverview(BaseModel):
    class_id: str
    class_name: str
    lesson_topic: str
    session_date: str
    status: str
    paths_status: List[Dict[str, Any]] = []
    active_interventions: List[InterventionSession] = []
    adaptation_summary: ClassroomAdaptationSummary

# ============================================================
# PHASE 5: SCHOOL INTELLIGENCE & EARLY-SUPPORT SIGNALS MODELS
# ============================================================

class SchoolSignal(BaseModel):
    id: str
    school_id: str
    type: Literal[
        "REPEATED_LEARNING_PATTERN",
        "PERSISTENT_DIFFICULTY",
        "EVIDENCE_COVERAGE_GAP",
        "POSITIVE_RESPONSE_PATTERN"
    ]
    title: str
    focus_skill: str
    affected_classes: List[str] = []
    affected_students_count: int = 0
    evidence_coverage_percentage: float = 0.0
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
    status: Literal["open", "under_review", "action_assigned", "resolved"] = "open"
    why_summary: str
    suggested_action: str
    first_observed: str
    last_updated: str

class SignalEvidence(BaseModel):
    id: str
    signal_id: str
    signal_title: str
    signal_type: str
    focus_skill: str
    classes_breakdown: List[Dict[str, Any]] = []
    overall_skill_status: Dict[str, int] = {}
    evidence_sources: Dict[str, str] = {}
    deterministic_calculation: str
    traceable_items: List[Dict[str, Any]] = []

class SchoolReview(BaseModel):
    id: str
    signal_id: str
    signal_title: str
    reviewer_id: str = "PRIN_001"
    action: Literal["reviewed", "acknowledged", "assigned_follow_up", "request_more_evidence"]
    assigned_to: Optional[str] = None
    review_question: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    status: Literal["open", "in_progress", "completed"] = "open"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class InstructionalPattern(BaseModel):
    id: str
    title: str
    focus_domain: str
    description: str
    session_count: int
    progress_count: int
    partial_count: int
    unresolved_count: int
    sessions_detail: List[Dict[str, Any]] = []

class EvidenceBrief(BaseModel):
    id: str
    school_id: str
    school_name: str
    reporting_period: str
    evidence_coverage_summary: str
    repeated_patterns_summary: str
    intervention_response_summary: str
    unresolved_areas_summary: str
    evidence_gaps_summary: str
    suggested_review: str
    source_snapshot: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class SchoolEvidenceTimelineEntry(BaseModel):
    date: str
    timestamp: str
    event: str
    phase: str
    detail: str

class SchoolIntelligenceOverview(BaseModel):
    school_id: str
    school_name: str
    academic_session: str
    last_updated: str
    total_students: int
    assessed_students: int
    coverage_percentage: float
    active_paths_count: int
    open_diagnostic_patterns_count: int
    intervention_responses_count: int
    signals: List[SchoolSignal] = []
    classrooms_coverage: List[Dict[str, Any]] = []
    skills_landscape: Dict[str, List[Dict[str, Any]]] = {}
    evidence_trends: List[Dict[str, Any]] = []
    intervention_landscape: Dict[str, Any] = {}
    positive_patterns: List[InstructionalPattern] = []
    timeline: List[SchoolEvidenceTimelineEntry] = []




