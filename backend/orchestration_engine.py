import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from models import (
    ClassroomPlan,
    InstructionalPath,
    PathMembership,
    LessonSegment,
    ClassroomActivity,
    LessonEvidenceItem,
    ClassroomOrchestrationOverview,
    OrchestrationBuildRequest,
    DiagnosticAnalysis,
    DiagnosticHistoryEntry,
    ResponseItem
)

# Standard Demo Student Profiles & Mapping for Grade 3 Section A (30 students)
PATH_A_STUDENT_IDS = ["ST001", "ST005", "ST009", "ST014", "ST018", "ST022"]
PATH_B_STUDENT_IDS = ["ST002", "ST003", "ST011", "ST016"]
PATH_C_STUDENT_IDS = ["ST007", "ST013", "ST021"]

class OrchestrationEngine:
    def __init__(self):
        pass

    def build_classroom_orchestration(
        self,
        class_id: str,
        class_name: str,
        grade: int,
        students: List[Any],
        fingerprints: Dict[str, Any],
        diagnostics: Dict[str, DiagnosticAnalysis],
        request: OrchestrationBuildRequest
    ) -> ClassroomPlan:
        duration = request.duration_minutes or 40
        topic = request.lesson_topic or "Two-Digit Subtraction with Regrouping"
        resources = request.available_resources or ["Blackboard", "Textbook", "Notebook", "Printed worksheet"]

        # Map all 30 students to student dictionary for fast lookup
        student_map = {s.id: s for s in students}
        all_student_ids = list(student_map.keys())

        # Determine membership for Path A (Regrouping Foundation)
        path_a_students: List[PathMembership] = []
        for s_id in PATH_A_STUDENT_IDS:
            if s_id in student_map:
                s = student_map[s_id]
                diag = diagnostics.get(s_id)
                hyp_status = diag.status if diag else "open"
                nlm = diag.next_learning_move.description if diag else "Investigate regrouping procedure directly with concrete base-ten exchange."
                path_a_students.append(PathMembership(
                    student_id=s_id,
                    student_name=s.name,
                    current_focus="2-Digit Subtraction (Regrouping)",
                    hypothesis_status=hyp_status,
                    next_learning_move=nlm,
                    evidence_basis="Phase 2 error analysis detected 0/4 regrouping tasks correct vs 4/4 non-regrouping tasks correct."
                ))

        # Determine membership for Path B (Word Decoding)
        path_b_students: List[PathMembership] = []
        for s_id in PATH_B_STUDENT_IDS:
            if s_id in student_map:
                s = student_map[s_id]
                diag = diagnostics.get(s_id)
                hyp_status = diag.status if diag else "open"
                nlm = diag.next_learning_move.description if diag else "Practice multi-syllable isolated word decoding cards."
                path_b_students.append(PathMembership(
                    student_id=s_id,
                    student_name=s.name,
                    current_focus="Paragraph Reading (Word Decoding)",
                    hypothesis_status=hyp_status,
                    next_learning_move=nlm,
                    evidence_basis="Phase 2 observed hesitation on unfamiliar multi-syllable words in connected text."
                ))

        # Determine membership for Path C (Number Comparison)
        path_c_students: List[PathMembership] = []
        for s_id in PATH_C_STUDENT_IDS:
            if s_id in student_map:
                s = student_map[s_id]
                diag = diagnostics.get(s_id)
                hyp_status = diag.status if diag else "open"
                nlm = "Consolidate tens-place magnitude comparison using partner number-card challenge."
                path_c_students.append(PathMembership(
                    student_id=s_id,
                    student_name=s.name,
                    current_focus="Number Comparison (Tens Orientation)",
                    hypothesis_status=hyp_status,
                    next_learning_move=nlm,
                    evidence_basis="Phase 1 assessment identified inverted tens vs ones place comparison on 2-digit pairs."
                ))

        # Determine membership for Path D (Independent Consolidation - remaining students)
        assigned_ids = set(PATH_A_STUDENT_IDS + PATH_B_STUDENT_IDS + PATH_C_STUDENT_IDS)
        path_d_students: List[PathMembership] = []
        for s_id in all_student_ids:
            if s_id not in assigned_ids and s_id in student_map:
                s = student_map[s_id]
                path_d_students.append(PathMembership(
                    student_id=s_id,
                    student_name=s.name,
                    current_focus="Consolidation & Application",
                    hypothesis_status="consolidated",
                    next_learning_move="Extend subtraction to two-step word problems in textbook exercise 4.",
                    evidence_basis="Demonstrated foundational skills in Phase 1 baseline without active diagnostic flags."
                ))

        # Scale durations based on total lesson time
        # Baseline is 40 min: Warmup 5 min, Path A 10 min, Path B 6 min, Path C 5 min, Path D 25 min (parallel), Exit 5 min
        if duration <= 20:
            warmup_m = 3
            path_a_m = 7
            path_b_m = 4
            path_c_m = 3
            exit_m = 3
            path_d_m = 11
            budget_direct = 11
        elif duration <= 30:
            warmup_m = 4
            path_a_m = 8
            path_b_m = 6
            path_c_m = 4
            exit_m = 4
            path_d_m = 18
            budget_direct = 14
        elif duration >= 60:
            warmup_m = 8
            path_a_m = 15
            path_b_m = 10
            path_c_m = 8
            exit_m = 7
            path_d_m = 37
            budget_direct = 25
        else: # 40 min
            warmup_m = 5
            path_a_m = 10
            path_b_m = 6
            path_c_m = 5
            exit_m = 5
            path_d_m = 25
            budget_direct = 21

        # Build Path A: Regrouping Foundation
        path_a = InstructionalPath(
            id="PATH_A",
            title="Path A — Regrouping Foundation",
            learning_focus="2-Digit Subtraction with Regrouping",
            domain="numeracy",
            teacher_attention="required",
            duration_minutes=path_a_m,
            student_ids=[s.student_id for s in path_a_students],
            students=path_a_students,
            rationale="Phase 2 diagnostic evidence indicates regrouping difficulty; errors are concentrated in borrowing across place values while non-regrouping tasks are demonstrated.",
            next_learning_move="Before continuing multi-digit subtraction, guide place-value exchange (1 ten = 10 ones) using concrete bundle drawings on the blackboard.",
            activity=ClassroomActivity(
                start_activity="Teacher demonstrates decomposition of 43 into 3 tens + 13 ones using ten-frame bundles on blackboard.",
                guided_activity="Students work in pairs with slates/notebooks to decompose 52 into 4 tens + 12 ones and solve 52 - 27 under direct guidance.",
                independent_activity="Students independently solve two structured 2-digit subtraction problems requiring regrouping.",
                exit_activity="Micro-evidence task: Solve 43 - 17 and 52 - 28 on exit slip with place-value exchange notation.",
                materials_needed=["Blackboard & Chalk", "Student Notebooks / Slates"]
            ),
            exit_task_ids=["TASK_EXIT_SUB_01", "TASK_EXIT_SUB_02"]
        )

        # Build Path B: Word Decoding
        path_b = InstructionalPath(
            id="PATH_B",
            title="Path B — Word Decoding",
            learning_focus="Multi-Syllable Isolated Word Decoding",
            domain="reading",
            teacher_attention="quick_check",
            duration_minutes=path_b_m,
            student_ids=[s.student_id for s in path_b_students],
            students=path_b_students,
            rationale="Phase 2 evidence observed hesitation and syllabic stumbling on unfamiliar compound words in continuous passage text.",
            next_learning_move="Present unfamiliar target words outside sentence context; verify phonemic blending before returning to narrative passage.",
            activity=ClassroomActivity(
                start_activity="Teacher distributes targeted flashcard decks containing 6 multi-syllable Marathi/English foundational vocabulary words.",
                guided_activity="Teacher conducts 3-minute rapid check on syllable finger-tapping for 'मैदानात' and 'चमत्कार'.",
                independent_activity="Paired flashcard challenge: Student A shows word, Student B decodes and segments syllables.",
                exit_activity="Read 2 unfamiliar target words in isolation directly to the teacher during circulation.",
                materials_needed=["Printed Flashcards", "Word Ring"]
            ),
            exit_task_ids=["TASK_EXIT_READ_01", "TASK_EXIT_READ_02"]
        )

        # Build Path C: Number Comparison
        path_c = InstructionalPath(
            id="PATH_C",
            title="Path C — Number Comparison",
            learning_focus="Place-Value Orientation (Tens vs Ones)",
            domain="numeracy",
            teacher_attention="recommended",
            duration_minutes=path_c_m,
            student_ids=[s.student_id for s in path_c_students],
            students=path_c_students,
            rationale="Evidence suggests inverted digit reading orientation when comparing 2-digit number pairs (e.g. evaluating ones before tens).",
            next_learning_move="Reinforce tens-place magnitude comparison using partner numeral-card game before multi-digit subtraction.",
            activity=ClassroomActivity(
                start_activity="Teacher provides structured rules for 'Highest Tens Wins' card comparison game.",
                guided_activity="Teacher observes first 2 rounds of partner play, prompting: 'Which place value determines magnitude first?'",
                independent_activity="Partner card tournament: Draw two 2-digit numbers, write symbol (<, >, =) in notebook.",
                exit_activity="Quick notebook check: Compare 73 vs 37, 48 vs 84 with circle around the tens digit.",
                materials_needed=["Number Cards (10-99)", "Student Notebooks"]
            ),
            exit_task_ids=["TASK_EXIT_COMP_01"]
        )

        # Build Path D: Independent Consolidation
        path_d = InstructionalPath(
            id="PATH_D",
            title="Path D — Independent Consolidation",
            learning_focus="Application & Word Problems",
            domain="general",
            teacher_attention="independent",
            duration_minutes=path_d_m,
            student_ids=[s.student_id for s in path_d_students],
            students=path_d_students,
            rationale="Learners have demonstrated core foundational subtraction and reading competencies; self-directed consolidation frees teacher attention for high-need paths.",
            next_learning_move="Apply two-digit subtraction to two-step contextual word problems in textbook exercise 4.",
            activity=ClassroomActivity(
                start_activity="Teacher writes two challenge contextual word problems on side blackboard.",
                guided_activity="Self-guided reference: Students review textbook worked example on page 42.",
                independent_activity="Students complete textbook problems #4 to #9 in notebooks, writing full number sentences.",
                exit_activity="Compose one real-world subtraction word problem from household context (e.g., shopping, fruits) in notebook.",
                materials_needed=["Textbook (Chapter 4)", "Student Notebooks"]
            ),
            exit_task_ids=["TASK_EXIT_CONSOL_01"]
        )

        # Construct visual classroom timeline segments
        timeline: List[LessonSegment] = []
        cur_min = 0

        # Segment 1: Whole Class Warm-up
        timeline.append(LessonSegment(
            id="SEG_01",
            start_minute=cur_min,
            end_minute=cur_min + warmup_m,
            title="Whole-Class Foundational Warm-up",
            segment_type="whole_class",
            active_path_id=None,
            teacher_role="Whole-class interactive choral counting and place-value decomposition hook on blackboard.",
            class_activity="All students participate in mental number decomposition (e.g. 'How many tens in 40?').",
            students_involved_count=len(all_student_ids)
        ))
        cur_min += warmup_m

        # Segment 2: Path A Direct Teacher Focus
        timeline.append(LessonSegment(
            id="SEG_02",
            start_minute=cur_min,
            end_minute=cur_min + path_a_m,
            title="Direct Teacher Support — Path A (Regrouping)",
            segment_type="teacher_focus",
            active_path_id="PATH_A",
            teacher_role="Direct guided instruction at front blackboard with Path A (6 students) on bundle exchange.",
            class_activity="Path B conducts paired flashcard reading; Path C plays comparison game; Path D works on textbook exercises.",
            students_involved_count=len(path_a_students)
        ))
        cur_min += path_a_m

        # Segment 3: Path B Quick-Check & Path C Peer Support
        mid_duration = path_b_m + path_c_m
        timeline.append(LessonSegment(
            id="SEG_03",
            start_minute=cur_min,
            end_minute=cur_min + mid_duration,
            title="Targeted Check — Path B & C Support",
            segment_type="quick_check",
            active_path_id="PATH_B",
            teacher_role="Teacher circulates: 3 min rapid check with Path B (word cards), 2 min check with Path C (number game).",
            class_activity="Path A transitions to independent subtraction practice; Path D continues textbook consolidation.",
            students_involved_count=len(path_b_students) + len(path_c_students)
        ))
        cur_min += mid_duration

        # Segment 4: Whole Class Consolidation / Exit Evidence
        timeline.append(LessonSegment(
            id="SEG_04",
            start_minute=cur_min,
            end_minute=duration,
            title="Whole-Class Exit Evidence & Wrap-Up",
            segment_type="exit_evidence",
            active_path_id=None,
            teacher_role="Teacher collects exit slips, records live micro-evidence observations on clipboard/device.",
            class_activity="All paths complete 2 micro-evidence exit tasks in notebooks/slates; teacher logs spot checks.",
            students_involved_count=len(all_student_ids)
        ))

        plan_id = f"PLAN_{class_id}_{datetime.now().strftime('%Y%m%d%H%M')}"
        budget = {
            "total_lesson_minutes": duration,
            "available_direct_minutes": budget_direct,
            "allocated_direct_minutes": path_a_m + path_b_m,
            "unallocated_buffer_minutes": max(0, budget_direct - (path_a_m + path_b_m)),
            "whole_class_minutes": warmup_m + exit_m,
            "independent_monitoring_minutes": max(0, duration - (warmup_m + path_a_m + path_b_m + exit_m))
        }

        plan = ClassroomPlan(
            id=plan_id,
            class_id=class_id,
            class_name=class_name,
            grade=grade,
            lesson_topic=topic,
            total_students=len(all_student_ids),
            duration_minutes=duration,
            available_resources=resources,
            status="ready",
            paths=[path_a, path_b, path_c, path_d],
            timeline=timeline,
            teacher_attention_budget=budget,
            evidence_records=[]
        )

        return plan

    def get_orchestration_overview(
        self,
        class_id: str,
        class_name: str,
        grade: int,
        students: List[Any],
        diagnostics: Dict[str, DiagnosticAnalysis],
        existing_plan: Optional[ClassroomPlan] = None
    ) -> ClassroomOrchestrationOverview:
        total_students = len(students)
        patterns_summary = [
            {
                "path_id": "PATH_A",
                "focus": "2-Digit Subtraction with Regrouping",
                "student_count": len(PATH_A_STUDENT_IDS),
                "attention_level": "required",
                "sample_student": "Aarav Sharma (ST001)",
                "rationale": "Phase 2 identified 0/4 regrouping tasks correct; prerequisite place-value exchange needs guided support."
            },
            {
                "path_id": "PATH_B",
                "focus": "Paragraph Reading (Word Decoding)",
                "student_count": len(PATH_B_STUDENT_IDS),
                "attention_level": "quick_check",
                "sample_student": "Ananya Deshmukh (ST002)",
                "rationale": "Phase 2 observed reading hesitation on unfamiliar multi-syllable words in connected text."
            },
            {
                "path_id": "PATH_C",
                "focus": "Number Comparison (Tens Orientation)",
                "student_count": len(PATH_C_STUDENT_IDS),
                "attention_level": "recommended",
                "sample_student": "Rahul Shinde (ST007)",
                "rationale": "Inverted place-value orientation when comparing 2-digit numbers."
            },
            {
                "path_id": "PATH_D",
                "focus": "Independent Consolidation",
                "student_count": total_students - (len(PATH_A_STUDENT_IDS) + len(PATH_B_STUDENT_IDS) + len(PATH_C_STUDENT_IDS)),
                "attention_level": "independent",
                "sample_student": "Priya Jadhav (ST004)",
                "rationale": "Core foundational skills demonstrated; self-directed textbook exercises and word problem application."
            }
        ]

        attention_breakdown = {
            "high": len(PATH_A_STUDENT_IDS),
            "moderate": len(PATH_C_STUDENT_IDS),
            "quick_check": len(PATH_B_STUDENT_IDS),
            "independent": total_students - (len(PATH_A_STUDENT_IDS) + len(PATH_B_STUDENT_IDS) + len(PATH_C_STUDENT_IDS))
        }

        return ClassroomOrchestrationOverview(
            class_id=class_id,
            class_name=class_name,
            grade=grade,
            lesson_topic="Two-Digit Subtraction with Regrouping",
            duration_minutes=40,
            total_students=total_students,
            patterns_summary=patterns_summary,
            attention_breakdown=attention_breakdown,
            existing_plan=existing_plan,
            available_resources=["Blackboard", "Textbook", "Notebook", "Printed worksheet"]
        )

    def record_lesson_evidence(
        self,
        plan: ClassroomPlan,
        evidence_items: List[LessonEvidenceItem],
        session_notes: Optional[str] = None
    ) -> ClassroomPlan:
        """
        Records live micro-evidence from the lesson session (Section 20 & 25).
        """
        for item in evidence_items:
            if not item.timestamp:
                item.timestamp = datetime.now().strftime("%H:%M:%S")
            plan.evidence_records.append(item)

        if session_notes:
            plan.teacher_notes = session_notes

        plan.status = "completed"
        plan.updated_at = datetime.now().isoformat()
        return plan

    def update_diagnostics_from_lesson_evidence(
        self,
        plan: ClassroomPlan,
        diagnostics: Dict[str, DiagnosticAnalysis]
    ) -> Dict[str, Any]:
        """
        Completes the Phase 3 -> Phase 2 Closed Loop (Section 21 & 26):
        Translates live lesson micro-evidence into updated Phase 2 diagnostic history and status.
        """
        updated_students = []
        for ev in plan.evidence_records:
            s_id = ev.student_id
            diag = diagnostics.get(s_id)
            if not diag:
                continue

            # If student demonstrated the exit task in Path A (e.g. Aarav Sharma)
            if ev.path_id == "PATH_A" and ev.result == "demonstrated":
                # Advance hypothesis to weakened/resolved and update Next Learning Move
                primary_hyp = diag.hypotheses[0] if diag.hypotheses else None
                if primary_hyp:
                    primary_hyp.status = "weakened"
                diag.status = "weakened"
                diag.next_learning_move.description = (
                    "Live lesson micro-evidence confirmed successful place-value exchange during 2-digit subtraction (43 - 17, 52 - 28). "
                    "Proceed to multi-step subtraction word problems in textbook exercise 5."
                )
                diag.next_learning_move.instructional_step = "Assign independent word problems with 2-digit subtraction."

                history_entry = DiagnosticHistoryEntry(
                    timestamp=datetime.now().strftime("%d %b %Y, %H:%M"),
                    event="Classroom Orchestration Micro-Evidence",
                    previous_status="OPEN",
                    updated_status="WEAKENED",
                    evidence_added=f"Live lesson exit task {ev.task_id} scored DEMONSTRATED. Observation: {ev.teacher_observation or 'Successfully exchanged 1 ten for 10 ones.'}",
                    interpretation="Learner successfully executed regrouping with place-value exchange in guided lesson. Bottleneck resolved."
                )
                diag.diagnostic_history.append(history_entry)
                updated_students.append({
                    "student_id": s_id,
                    "student_name": ev.student_name,
                    "signal": "Regrouping procedure now demonstrated in live lesson.",
                    "new_status": "WEAKENED"
                })

            elif ev.path_id == "PATH_B" and ev.result == "demonstrated":
                diag.status = "weakened"
                diag.next_learning_move.description = "Isolated word decoding confirmed accurate. Re-integrate target vocabulary into connected 2-sentence stories."
                diag.diagnostic_history.append(DiagnosticHistoryEntry(
                    timestamp=datetime.now().strftime("%d %b %Y, %H:%M"),
                    event="Classroom Orchestration Micro-Evidence",
                    previous_status="OPEN",
                    updated_status="WEAKENED",
                    evidence_added=f"Flashcard exit check {ev.task_id} demonstrated.",
                    interpretation="Syllable decoding secure in isolation. Ready for connected sentence reading."
                ))
                updated_students.append({
                    "student_id": s_id,
                    "student_name": ev.student_name,
                    "signal": "Isolated word decoding demonstrated during flashcard check.",
                    "new_status": "WEAKENED"
                })

        return {
            "status": "diagnostics_updated_from_orchestration",
            "plan_id": plan.id,
            "evidence_count": len(plan.evidence_records),
            "updated_students": updated_students
        }

orchestration_engine = OrchestrationEngine()
