from typing import Dict, List, Optional, Any
import random
from models import (
    Teacher,
    ClassRoom,
    Student,
    Assessment,
    ResponseItem,
    Observation,
    LearningFingerprint,
    ClassroomLearningMap,
    SkillDistribution,
    DiagnosticAnalysis,
    ClassroomDiagnosticOverview,
    ClassroomPlan,
    ClassroomOrchestrationOverview,
    OrchestrationBuildRequest,
    LessonEvidenceItem
)
from assessment_content import get_foundational_assessments, SKILL_DEFINITIONS
from evidence_engine import compute_skill_evidence, determine_confidence_level, generate_grounded_narrative, structure_teacher_observation
from diagnostic_engine import analyze_student_learning_gaps, build_classroom_diagnostic_overview
from orchestration_engine import orchestration_engine

class DataStore:
    def __init__(self):
        self.teacher: Teacher = Teacher(
            id="TCH001",
            name="Sunita Patil",
            email="sunita.patil@school.edu.in",
            school_name="Zilla Parishad Primary School, Shirur"
        )
        self.classes: Dict[str, ClassRoom] = {}
        self.students: Dict[str, Student] = {}
        self.assessments: Dict[str, Assessment] = {}
        self.responses: Dict[str, List[ResponseItem]] = {}  # student_id -> list of ResponseItem
        self.observations: Dict[str, List[Observation]] = {} # student_id -> list of Observation
        self.fingerprints: Dict[str, LearningFingerprint] = {} # student_id -> LearningFingerprint
        self.diagnostics: Dict[str, DiagnosticAnalysis] = {} # student_id -> DiagnosticAnalysis
        self.classroom_plans: Dict[str, ClassroomPlan] = {} # plan_id -> ClassroomPlan, and class_id -> latest plan
        self._seed_demo_data()

    def _seed_demo_data(self):
        # 1. Create Class
        c_id = "CLS_G3A"
        class_obj = ClassRoom(
            id=c_id,
            name="Grade 3 — Section A",
            grade=3,
            language="Marathi",
            academic_year="2026-2027",
            teacher_id=self.teacher.id,
            student_count=30,
            completed_count=22,
            in_progress_count=2,
            not_assessed_count=6
        )
        self.classes[c_id] = class_obj

        # 2. Load Assessments
        assessments_list = get_foundational_assessments(language="Marathi")
        for asm in assessments_list:
            self.assessments[asm.id] = asm

        # 3. 30 Realistic Students
        student_names = [
            ("Aarav Sharma", "ST001", "01"),
            ("Ananya Deshmukh", "ST002", "02"),
            ("Rohan Kulkarni", "ST003", "03"),
            ("Priya Gaikwad", "ST004", "04"),
            ("Sai Shinde", "ST005", "05"),
            ("Isha Pawar", "ST006", "06"),
            ("Aditya Jadhav", "ST007", "07"),
            ("Tanvi More", "ST008", "08"),
            ("Omkar Chavan", "ST009", "09"),
            ("Sneha Joshi", "ST010", "10"),
            ("Vedant Kamble", "ST011", "11"),
            ("Riddhi Wagh", "ST012", "12"),
            ("Harsh Bhosale", "ST013", "13"),
            ("Gauri Sawant", "ST014", "14"),
            ("Atharva Thorat", "ST015", "15"),
            ("Kavya Salunkhe", "ST016", "16"),
            ("Pranav Mane", "ST017", "17"),
            ("Diya Shingare", "ST018", "18"),
            ("Yash Ingle", "ST019", "19"),
            ("Siddhi Kale", "ST020", "20"),
            ("Karan Kharat", "ST021", "21"),
            ("Meera Mohite", "ST022", "22"),
            # In Progress
            ("Abhishek Tambe", "ST023", "23"),
            ("Pooja Kadam", "ST024", "24"),
            # Not Assessed (For Live Demo Assessment)
            ("Arjun Nalawade", "ST025", "25"),
            ("Swara Jagtap", "ST026", "26"),
            ("Chetan Solanki", "ST027", "27"),
            ("Neha Londhe", "ST028", "28"),
            ("Suresh Garud", "ST029", "29"),
            ("Vaishnavi Ghule", "ST030", "30"),
        ]

        colors = ["#4F46E5", "#0891B2", "#059669", "#D97706", "#7C3AED", "#DB2777"]

        reading_items = self.assessments["ASM_READ_G3"].items
        numeracy_items = self.assessments["ASM_NUM_G3"].items

        # Archetypes for the 22 assessed students
        # 1-6: Strong Reading / Weak Subtraction
        # 7-12: Strong Numeracy / Emerging Reading
        # 13-18: Emerging Both
        # 19-22: Strong Both
        for idx, (name, s_id, roll) in enumerate(student_names):
            if idx < 22:
                status = "completed"
            elif idx < 24:
                status = "in_progress"
            else:
                status = "not_assessed"

            student = Student(
                id=s_id,
                roll_number=roll,
                name=name,
                grade=3,
                language="Marathi",
                class_id=c_id,
                assessment_status=status,
                avatar_color=colors[idx % len(colors)]
            )
            self.students[s_id] = student
            self.responses[s_id] = []
            self.observations[s_id] = []

            # Populate responses for completed / in_progress students
            if status == "completed":
                self._generate_student_seed_responses(s_id, idx, reading_items, numeracy_items)
            elif status == "in_progress":
                # Only 4 reading items completed
                for item in reading_items[:4]:
                    self.responses[s_id].append(ResponseItem(
                        id=f"RES_{s_id}_{item.id}",
                        student_id=s_id,
                        assessment_id=item.assessment_id,
                        question_id=item.id,
                        skill_id=item.skill_id,
                        domain=item.domain,
                        expected_response=item.expected_response,
                        student_response=item.expected_response,
                        correct=True,
                        teacher_observation="Responded readily to first items."
                    ))

        # Build fingerprints for all completed students
        for s_id, student in self.students.items():
            if student.assessment_status == "completed":
                self.recompute_fingerprint(s_id)

        # Seed initial Phase 2 Diagnostic Analyses
        self.get_student_diagnostic("ST001", "subtraction")
        self.get_student_diagnostic("ST002", "paragraph_reading")
        self.get_student_diagnostic("ST003", "paragraph_reading")

        # Seed initial Phase 3 Classroom Plan
        self.build_classroom_plan(c_id)

    def _generate_student_seed_responses(self, s_id: str, archetype_idx: int, reading_items, numeracy_items):
        name = self.students[s_id].name
        # Seed profiles:
        # 0: Aarav Sharma (Strong Reading, Subtraction Emerging)
        # 1: Ananya Deshmukh (Strong Numeracy, Emerging Reading)
        # 2: Rohan Kulkarni (Emerging in both)
        # 3: Priya Gaikwad (Strong in both)
        
        # Decide skill mastery probabilities based on archetype
        if archetype_idx in [0, 4, 8, 12]:  # Strong Reading / Emerging Subtraction
            p_read = {"letter_recognition": 1.0, "word_reading": 0.9, "sentence_reading": 0.8, "paragraph_reading": 0.7, "comprehension": 0.7}
            p_num = {"number_recognition": 1.0, "number_comparison": 0.9, "basic_operations": 0.8, "addition": 0.75, "subtraction": 0.3, "basic_multiplication": 0.3}
            obs_list = ["Reads with good expression.", "Struggles with borrowing when subtracting from smaller unit digit."]
        elif archetype_idx in [1, 5, 9, 13]:  # Strong Numeracy / Emerging Reading
            p_read = {"letter_recognition": 0.9, "word_reading": 0.6, "sentence_reading": 0.4, "paragraph_reading": 0.3, "comprehension": 0.3}
            p_num = {"number_recognition": 1.0, "number_comparison": 1.0, "basic_operations": 1.0, "addition": 0.9, "subtraction": 0.85, "basic_multiplication": 0.7}
            obs_list = ["Recognizes letters accurately but hesitates on compound words.", "Strong mental math strategies on addition and subtraction."]
        elif archetype_idx in [2, 6, 10, 14, 16, 18, 20]:  # Emerging across board
            p_read = {"letter_recognition": 0.8, "word_reading": 0.5, "sentence_reading": 0.3, "paragraph_reading": 0.2, "comprehension": 0.2}
            p_num = {"number_recognition": 0.85, "number_comparison": 0.6, "basic_operations": 0.6, "addition": 0.4, "subtraction": 0.25, "basic_multiplication": 0.2}
            obs_list = ["Takes time to decode 3-letter words.", "Uses finger counting for single-digit operations."]
        else:  # Strong in both
            p_read = {"letter_recognition": 1.0, "word_reading": 1.0, "sentence_reading": 0.9, "paragraph_reading": 0.85, "comprehension": 0.9}
            p_num = {"number_recognition": 1.0, "number_comparison": 1.0, "basic_operations": 1.0, "addition": 0.9, "subtraction": 0.85, "basic_multiplication": 0.8}
            obs_list = ["Fluent and expressive reader.", "Confident in multi-digit operations and place-value concept."]

        # Generate reading responses
        for item in reading_items:
            prob = p_read.get(item.skill_id, 0.7)
            # deterministic pseudorandom based on student index and item
            val = ((hash(f"{s_id}_{item.id}") % 100) / 100.0)
            is_correct = val < prob
            student_resp = item.expected_response if is_correct else (f"approx_{item.expected_response}" if len(item.expected_response) < 10 else "hesitated")
            
            obs = obs_list[0] if (not is_correct and item.skill_id in ["word_reading", "paragraph_reading"]) else None
            self.responses[s_id].append(ResponseItem(
                id=f"RES_{s_id}_{item.id}",
                student_id=s_id,
                assessment_id=item.assessment_id,
                question_id=item.id,
                skill_id=item.skill_id,
                domain=item.domain,
                expected_response=item.expected_response,
                student_response=student_resp,
                correct=is_correct,
                teacher_observation=obs
            ))

        # Generate numeracy responses
        for item in numeracy_items:
            prob = p_num.get(item.skill_id, 0.7)
            val = ((hash(f"{s_id}_{item.id}_num") % 100) / 100.0)
            is_correct = val < prob
            student_resp = item.expected_response if is_correct else (str(int(item.expected_response) + 10) if item.expected_response.isdigit() else "incorrect_guess")
            
            obs = obs_list[1] if (not is_correct and item.skill_id == "subtraction") else None
            self.responses[s_id].append(ResponseItem(
                id=f"RES_{s_id}_{item.id}",
                student_id=s_id,
                assessment_id=item.assessment_id,
                question_id=item.id,
                skill_id=item.skill_id,
                domain=item.domain,
                expected_response=item.expected_response,
                student_response=student_resp,
                correct=is_correct,
                teacher_observation=obs
            ))

        for obs in obs_list:
            self.observations[s_id].append(Observation(
                id=f"OBS_{s_id}_{len(self.observations[s_id])}",
                student_id=s_id,
                raw_text=obs,
                observation_type="general",
                source="teacher"
            ))

    def recompute_fingerprint(self, student_id: str) -> Optional[LearningFingerprint]:
        student = self.students.get(student_id)
        if not student:
            return None

        responses = self.responses.get(student_id, [])
        if not responses:
            return None

        read_ev, read_class = compute_skill_evidence(responses, "reading", SKILL_DEFINITIONS["reading"])
        num_ev, num_class = compute_skill_evidence(responses, "numeracy", SKILL_DEFINITIONS["numeracy"])
        all_evidence = read_ev + num_ev

        total_attempts = len(responses)
        skills_assessed = sum(1 for e in all_evidence if e.status != "not_assessed")
        confidence = determine_confidence_level(total_attempts, skills_assessed)

        obs_texts = [o.raw_text for o in self.observations.get(student_id, []) if o.raw_text.strip()]
        for r in responses:
            if r.teacher_observation and r.teacher_observation.strip():
                obs_texts.append(r.teacher_observation.strip())
        unique_obs = list(dict.fromkeys(obs_texts))
        structured_obs = [structure_teacher_observation(o) for o in unique_obs]

        narrative = generate_grounded_narrative(student.name, read_ev, num_ev, unique_obs)

        fp = LearningFingerprint(
            id=f"FP_{student_id}",
            student_id=student_id,
            student_name=student.name,
            grade=student.grade,
            language=student.language,
            assessment_date="2026-09-27",
            confidence=confidence,
            reading_status=read_class,
            numeracy_status=num_class,
            evidence_breakdown=all_evidence,
            teacher_observations_summary=unique_obs,
            structured_observations=structured_obs,
            ai_summary_narrative=narrative,
            teacher_verified=False,
            teacher_notes=None
        )
        self.fingerprints[student_id] = fp
        return fp

    def get_classroom_learning_map(self, class_id: str) -> ClassroomLearningMap:
        class_obj = self.classes.get(class_id)
        students = [s for s in self.students.values() if s.class_id == class_id]
        
        # Skill distributions
        reading_dist: Dict[str, SkillDistribution] = {
            s["id"]: SkillDistribution(skill_id=s["id"], skill_title=s["title"], domain="reading")
            for s in SKILL_DEFINITIONS["reading"]
        }
        numeracy_dist: Dict[str, SkillDistribution] = {
            s["id"]: SkillDistribution(skill_id=s["id"], skill_title=s["title"], domain="numeracy")
            for s in SKILL_DEFINITIONS["numeracy"]
        }

        completed_cnt = 0
        in_prog_cnt = 0
        not_ass_cnt = 0

        for student in students:
            if student.assessment_status == "completed":
                completed_cnt += 1
            elif student.assessment_status == "in_progress":
                in_prog_cnt += 1
            else:
                not_ass_cnt += 1

            fp = self.fingerprints.get(student.id)
            if not fp:
                # Count as not assessed for all skills
                for s_dist in reading_dist.values():
                    s_dist.not_assessed_count += 1
                    s_dist.students_not_assessed.append(student.name)
                for s_dist in numeracy_dist.values():
                    s_dist.not_assessed_count += 1
                    s_dist.students_not_assessed.append(student.name)
                continue

            # Process Reading
            for s_id in fp.reading_status.demonstrated:
                if s_id in reading_dist:
                    reading_dist[s_id].demonstrated_count += 1
                    reading_dist[s_id].students_demonstrated.append(student.name)
            for s_id in fp.reading_status.emerging:
                if s_id in reading_dist:
                    reading_dist[s_id].emerging_count += 1
                    reading_dist[s_id].students_emerging.append(student.name)
            for s_id in fp.reading_status.not_yet_demonstrated:
                if s_id in reading_dist:
                    reading_dist[s_id].not_yet_count += 1
                    reading_dist[s_id].students_not_yet.append(student.name)
            for s_id in fp.reading_status.not_assessed:
                if s_id in reading_dist:
                    reading_dist[s_id].not_assessed_count += 1
                    reading_dist[s_id].students_not_assessed.append(student.name)

            # Process Numeracy
            for s_id in fp.numeracy_status.demonstrated:
                if s_id in numeracy_dist:
                    numeracy_dist[s_id].demonstrated_count += 1
                    numeracy_dist[s_id].students_demonstrated.append(student.name)
            for s_id in fp.numeracy_status.emerging:
                if s_id in numeracy_dist:
                    numeracy_dist[s_id].emerging_count += 1
                    numeracy_dist[s_id].students_emerging.append(student.name)
            for s_id in fp.numeracy_status.not_yet_demonstrated:
                if s_id in numeracy_dist:
                    numeracy_dist[s_id].not_yet_count += 1
                    numeracy_dist[s_id].students_not_yet.append(student.name)
            for s_id in fp.numeracy_status.not_assessed:
                if s_id in numeracy_dist:
                    numeracy_dist[s_id].not_assessed_count += 1
                    numeracy_dist[s_id].students_not_assessed.append(student.name)

        summary = (
            f"Classroom map shows wide foundational literacy variance: while letter recognition is demonstrated by "
            f"{reading_dist['letter_recognition'].demonstrated_count} students, paragraph reading remains emerging for "
            f"{reading_dist['paragraph_reading'].emerging_count} students. In numeracy, single digit operations are solid, "
            f"while 2-digit subtraction with regrouping requires targeted attention for {numeracy_dist['subtraction'].emerging_count + numeracy_dist['subtraction'].not_yet_count} students."
        )

        return ClassroomLearningMap(
            class_id=class_id,
            class_name=class_obj.name if class_obj else "Class",
            grade=class_obj.grade if class_obj else 3,
            language=class_obj.language if class_obj else "Marathi",
            total_students=len(students),
            assessed_count=completed_cnt,
            in_progress_count=in_prog_cnt,
            not_assessed_count=not_ass_cnt,
            reading_matrix=list(reading_dist.values()),
            numeracy_matrix=list(numeracy_dist.values()),
            summary_insight=summary
        )

    def get_student_diagnostic(self, student_id: str, skill_id: Optional[str] = None) -> Optional[DiagnosticAnalysis]:
        student = self.students.get(student_id)
        if not student:
            return None

        # Check existing cached analysis
        cache_key = f"{student_id}_{skill_id}" if skill_id else student_id
        if student_id in self.diagnostics and not skill_id:
            return self.diagnostics[student_id]
        if cache_key in self.diagnostics:
            return self.diagnostics[cache_key]

        responses = self.responses.get(student_id, [])
        observations = self.observations.get(student_id, [])
        fp = self.fingerprints.get(student_id)

        analysis = analyze_student_learning_gaps(
            student_id=student.id,
            student_name=student.name,
            responses=responses,
            observations=observations,
            fingerprint=fp,
            target_skill_id=skill_id
        )

        if analysis:
            self.diagnostics[student_id] = analysis
            self.diagnostics[cache_key] = analysis

        return analysis

    def save_diagnostic(self, student_id: str, analysis: DiagnosticAnalysis) -> DiagnosticAnalysis:
        self.diagnostics[student_id] = analysis
        cache_key = f"{student_id}_{analysis.skill_id}"
        self.diagnostics[cache_key] = analysis
        return analysis

    def get_classroom_diagnostics(self, class_id: str) -> ClassroomDiagnosticOverview:
        class_obj = self.classes.get(class_id)
        students = [s for s in self.students.values() if s.class_id == class_id]
        return build_classroom_diagnostic_overview(
            class_id=class_id,
            class_name=class_obj.name if class_obj else "Class",
            students=students,
            fingerprints=self.fingerprints
        )

    def get_orchestration_overview(self, class_id: str) -> ClassroomOrchestrationOverview:
        class_obj = self.classes.get(class_id)
        students = [s for s in self.students.values() if s.class_id == class_id]
        existing_plan = self.classroom_plans.get(class_id)
        return orchestration_engine.get_orchestration_overview(
            class_id=class_id,
            class_name=class_obj.name if class_obj else "Class",
            grade=class_obj.grade if class_obj else 3,
            students=students,
            diagnostics=self.diagnostics,
            existing_plan=existing_plan
        )

    def build_classroom_plan(self, class_id: str, request: Optional[OrchestrationBuildRequest] = None) -> ClassroomPlan:
        class_obj = self.classes.get(class_id)
        students = [s for s in self.students.values() if s.class_id == class_id]
        if not request:
            request = OrchestrationBuildRequest()

        # Ensure all Phase 2 diagnostics are seeded/loaded
        for s in students:
            if s.id not in self.diagnostics:
                self.get_student_diagnostic(s.id)

        plan = orchestration_engine.build_classroom_orchestration(
            class_id=class_id,
            class_name=class_obj.name if class_obj else "Class",
            grade=class_obj.grade if class_obj else 3,
            students=students,
            fingerprints=self.fingerprints,
            diagnostics=self.diagnostics,
            request=request
        )

        self.classroom_plans[plan.id] = plan
        self.classroom_plans[class_id] = plan
        return plan

    def get_orchestration_plan(self, plan_id: str) -> Optional[ClassroomPlan]:
        if plan_id in self.classroom_plans:
            return self.classroom_plans[plan_id]
        # Check by class_id
        return self.classroom_plans.get(plan_id)

    def save_orchestration_plan(self, plan: ClassroomPlan) -> ClassroomPlan:
        self.classroom_plans[plan.id] = plan
        self.classroom_plans[plan.class_id] = plan
        return plan

    def record_lesson_evidence(self, plan_id: str, evidence_items: List[LessonEvidenceItem], notes: Optional[str] = None) -> ClassroomPlan:
        plan = self.get_orchestration_plan(plan_id)
        if not plan:
            raise ValueError("Plan not found")
        updated_plan = orchestration_engine.record_lesson_evidence(plan, evidence_items, notes)
        self.save_orchestration_plan(updated_plan)
        return updated_plan

    def update_diagnostics_from_lesson(self, plan_id: str) -> Dict[str, Any]:
        plan = self.get_orchestration_plan(plan_id)
        if not plan:
            raise ValueError("Plan not found")
        result = orchestration_engine.update_diagnostics_from_lesson_evidence(plan, self.diagnostics)
        return result

db = DataStore()


