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
