import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from models import (
    SchoolSignal,
    SignalEvidence,
    SchoolReview,
    InstructionalPattern,
    EvidenceBrief,
    SchoolEvidenceTimelineEntry,
    SchoolIntelligenceOverview
)

class SchoolIntelligenceEngine:
    def __init__(self):
        pass

    def build_school_overview(
        self,
        school_id: str = "SCH_ZP_SHIRUR",
        reviews: Optional[List[SchoolReview]] = None
    ) -> SchoolIntelligenceOverview:
        reviews = reviews or []
        review_map = {r.signal_id: r for r in reviews}

        # 1. Deterministic signals
        signals = self.generate_school_signals(review_map)

        # 2. Classroom coverage breakdown (strictly coverage, NEVER ranking)
        classrooms_coverage = [
            {
                "class_id": "CLS_G3A",
                "class_name": "Grade 3 — Section A",
                "teacher_name": "Smt. Sunita Rao",
                "total_students": 30,
                "assessed_count": 28,
                "coverage_percentage": 93.3,
                "open_patterns_count": 4,
                "interventions_count": 8,
                "post_evidence_count": 24,
                "status": "Adequate Coverage"
            },
            {
                "class_id": "CLS_G3B",
                "class_name": "Grade 3 — Section B",
                "teacher_name": "Shri. Ramesh Jadhav",
                "total_students": 32,
                "assessed_count": 27,
                "coverage_percentage": 84.4,
                "open_patterns_count": 5,
                "interventions_count": 7,
                "post_evidence_count": 18,
                "status": "Adequate Coverage"
            },
            {
                "class_id": "CLS_G4A",
                "class_name": "Grade 4 — Section A",
                "teacher_name": "Smt. Anjali Deshmukh",
                "total_students": 34,
                "assessed_count": 26,
                "coverage_percentage": 76.5,
                "open_patterns_count": 6,
                "interventions_count": 6,
                "post_evidence_count": 15,
                "status": "Evidence In Progress"
            },
            {
                "class_id": "CLS_G2B",
                "class_name": "Grade 2 — Section B",
                "teacher_name": "Shri. Prakash Shinde",
                "total_students": 28,
                "assessed_count": 15,
                "coverage_percentage": 53.6,
                "open_patterns_count": 3,
                "interventions_count": 2,
                "post_evidence_count": 4,
                "status": "Evidence Gap Detected"
            },
            {
                "class_id": "CLS_G2A",
                "class_name": "Grade 2 — Section A",
                "teacher_name": "Smt. Meena Patil",
                "total_students": 18,
                "assessed_count": 16,
                "coverage_percentage": 88.9,
                "open_patterns_count": 2,
                "interventions_count": 3,
                "post_evidence_count": 6,
                "status": "Adequate Coverage"
            }
        ]

        total_students = sum(c["total_students"] for c in classrooms_coverage)
        assessed_students = sum(c["assessed_count"] for c in classrooms_coverage)
        coverage_percentage = round((assessed_students / max(1, total_students)) * 100, 1)

        # 3. School Learning Landscape (Literacy and Numeracy distribution)
        skills_landscape = {
            "literacy": [
                {"skill_id": "letter_recognition", "skill_title": "Letter Recognition", "demonstrated": 98, "emerging": 12, "not_yet": 4, "not_assessed": 4},
                {"skill_id": "word_reading", "skill_title": "Word Reading (Decoding)", "demonstrated": 74, "emerging": 24, "not_yet": 16, "not_assessed": 4},
                {"skill_id": "sentence_reading", "skill_title": "Sentence Reading", "demonstrated": 62, "emerging": 28, "not_yet": 24, "not_assessed": 4},
                {"skill_id": "paragraph_reading", "skill_title": "Paragraph Reading (Fluency)", "demonstrated": 51, "emerging": 33, "not_yet": 30, "not_assessed": 4},
                {"skill_id": "comprehension", "skill_title": "Reading Comprehension", "demonstrated": 44, "emerging": 38, "not_yet": 32, "not_assessed": 4}
            ],
            "numeracy": [
                {"skill_id": "number_recognition", "skill_title": "Number Recognition (1–99)", "demonstrated": 102, "emerging": 10, "not_yet": 2, "not_assessed": 4},
                {"skill_id": "number_comparison", "skill_title": "Number Comparison & Place Orientation", "demonstrated": 79, "emerging": 23, "not_yet": 12, "not_assessed": 4},
                {"skill_id": "addition", "skill_title": "Addition with Regrouping", "demonstrated": 68, "emerging": 26, "not_yet": 20, "not_assessed": 4},
                {"skill_id": "subtraction", "skill_title": "2-Digit Subtraction with Regrouping", "demonstrated": 47, "emerging": 38, "not_yet": 29, "not_assessed": 4},
                {"skill_id": "multiplication", "skill_title": "Multiplication (Equal Grouping)", "demonstrated": 38, "emerging": 32, "not_yet": 44, "not_assessed": 4}
            ]
        }

        # 4. Evidence Trends over 4 weeks
        evidence_trends = [
            {"period": "Week 1 (04 Sep)", "coverage_pct": 54.2, "assessed": 77, "interventions_active": 4},
            {"period": "Week 2 (11 Sep)", "coverage_pct": 68.3, "assessed": 97, "interventions_active": 7},
            {"period": "Week 3 (18 Sep)", "coverage_pct": 76.1, "assessed": 108, "interventions_active": 10},
            {"period": "Week 4 (24 Sep)", "coverage_pct": 83.1, "assessed": 118, "interventions_active": 12}
        ]

        # 5. Intervention Landscape
        intervention_landscape = {
            "total_interventions_recorded": 67,
            "progress_observed": 41,
            "partial_response": 15,
            "continued_difficulty": 7,
            "insufficient_evidence": 4,
            "focal_distributions": [
                {"focus": "Reading Fluency & Decoding", "count": 26, "progress_rate": 61.5},
                {"focus": "2-Digit Subtraction & Place-Value", "count": 24, "progress_rate": 70.8},
                {"focus": "Number Comparison & Place Value", "count": 12, "progress_rate": 83.3},
                {"focus": "Equal Grouping / Multiplication", "count": 5, "progress_rate": 40.0}
            ]
        }

        # 6. Positive Instructional Patterns Library (Section 16)
        positive_patterns = [
            InstructionalPattern(
                id="PAT_CVS_01",
                title="Concrete → Visual → Symbolic Sequence",
                focus_domain="Place-Value Exchange in 2-Digit Subtraction",
                description="Pairing physical bundle-and-sticks manipulation with column notation representation before independent numerical calculation.",
                session_count=22,
                progress_count=17,
                partial_count=3,
                unresolved_count=2,
                sessions_detail=[
                    {"session_id": "INT_ST001_SUB", "student_name": "Aarav Sharma", "class": "Grade 3A", "outcome": "Supported Progress (+40 pts)"},
                    {"session_id": "INT_ST014_SUB", "student_name": "Rohan Patil", "class": "Grade 3A", "outcome": "Supported Progress (+40 pts)"},
                    {"session_id": "INT_ST044_SUB", "student_name": "Mayur More", "class": "Grade 3B", "outcome": "Supported Progress (+35 pts)"}
                ]
            ),
            InstructionalPattern(
                id="PAT_PHON_02",
                title="Phoneme Segmenting with Finger Tapping",
                focus_domain="Multi-syllabic Word Decoding in Marathi",
                description="Students tap syllables on fingers while isolating conjunct sounds before whole-word pronunciation.",
                session_count=18,
                progress_count=14,
                partial_count=3,
                unresolved_count=1,
                sessions_detail=[
                    {"session_id": "INT_ST002_READ", "student_name": "Ananya Deshmukh", "class": "Grade 3A", "outcome": "Supported Progress (+67 pts)"},
                    {"session_id": "INT_ST038_READ", "student_name": "Kavita Gade", "class": "Grade 3B", "outcome": "Supported Progress (+50 pts)"}
                ]
            ),
            InstructionalPattern(
                id="PAT_NUM_03",
                title="Tens-Frame Numeral Card Pairing",
                focus_domain="Place-Value Magnitude & Numeral Comparison",
                description="Students orient dual-digit cards into 10-frames to observe magnitude differences before symbol insertion (<, >, =).",
                session_count=12,
                progress_count=10,
                partial_count=2,
                unresolved_count=0,
                sessions_detail=[
                    {"session_id": "INT_ST004_NUM", "student_name": "Priya Gaikwad", "class": "Grade 3A", "outcome": "Supported Progress"}
                ]
            )
        ]

        # 7. School Evidence Timeline (Section 24)
        timeline = [
            SchoolEvidenceTimelineEntry(
                date="18 Sep",
                timestamp="09:00",
                event="School Baseline Assessment Commences",
                phase="Phase 1: Assess",
                detail="Classroom baseline administration initiated across 5 sections. 77 students initially assessed."
            ),
            SchoolEvidenceTimelineEntry(
                date="19 Sep",
                timestamp="14:30",
                event="Concentrated Subtraction Difficulty Detected",
                phase="Phase 2: Diagnose",
                detail="Diagnostic engine identified repeated regrouping error across Grade 3A, 3B, and Grade 4A."
            ),
            SchoolEvidenceTimelineEntry(
                date="20 Sep",
                timestamp="11:15",
                event="Diagnostic Hypotheses Opened for Investigation",
                phase="Phase 2: Diagnose",
                detail="18 diagnostic checks scheduled across numeracy and reading fluency domains."
            ),
            SchoolEvidenceTimelineEntry(
                date="21 Sep",
                timestamp="10:00",
                event="Temporary Instructional Paths Orchestrated",
                phase="Phase 3: Orchestrate",
                detail="12 instructional paths created across classrooms to target foundational regrouping and decoding."
            ),
            SchoolEvidenceTimelineEntry(
                date="22 Sep",
                timestamp="13:45",
                event="First Post-Intervention Evidence Synchronized",
                phase="Phase 4: Teach & Adapt",
                detail="Classroom post-checks conducted. Initial before/after deltas calculated (+40 percentage points)."
            ),
            SchoolEvidenceTimelineEntry(
                date="23 Sep",
                timestamp="16:00",
                event="Positive Response Pattern Recognized",
                phase="Phase 4: Teach & Adapt",
                detail="Concrete-to-symbolic place-value exchange produced progress in 17 of 22 documented sessions."
            ),
            SchoolEvidenceTimelineEntry(
                date="24 Sep",
                timestamp="10:42",
                event="School Intelligence Early-Support Signals Generated",
                phase="Phase 5: School Intelligence",
                detail="Multi-classroom aggregation compiled. 4 priority early-support signals surfaced for instructional leadership review."
            )
        ]

        return SchoolIntelligenceOverview(
            school_id=school_id,
            school_name="Zilla Parishad Primary School, Shirur",
            academic_session="2026–27",
            last_updated="24 September 2026, 10:42 AM",
            total_students=total_students,
            assessed_students=assessed_students,
            coverage_percentage=coverage_percentage,
            active_paths_count=12,
            open_diagnostic_patterns_count=18,
            intervention_responses_count=67,
            signals=signals,
            classrooms_coverage=classrooms_coverage,
            skills_landscape=skills_landscape,
            evidence_trends=evidence_trends,
            intervention_landscape=intervention_landscape,
            positive_patterns=positive_patterns,
            timeline=timeline
        )

    def generate_school_signals(self, review_map: Dict[str, SchoolReview]) -> List[SchoolSignal]:
        """
        Deterministic aggregation of school-level signals (Section 6 & 7).
        """
        signals = [
            # Signal 1: Repeated Learning Pattern across multiple classes
            SchoolSignal(
                id="SIG_REP_SUB_01",
                school_id="SCH_ZP_SHIRUR",
                type="REPEATED_LEARNING_PATTERN",
                title="Repeated Learning Gap: 2-Digit Subtraction",
                focus_skill="2-Digit Subtraction with Regrouping",
                affected_classes=["Grade 3A", "Grade 3B", "Grade 4A"],
                affected_students_count=31,
                evidence_coverage_percentage=91.8,
                confidence="HIGH",
                status="under_review" if "SIG_REP_SUB_01" in review_map else "open",
                why_summary="The skill is classified as Emerging or Not Yet Demonstrated for 31 students across three separate sections (Grade 3A: 8, Grade 3B: 11, Grade 4A: 12), indicating a structural prerequisite gap rather than isolated variance.",
                suggested_action="Review place-value exchange representation across Grades 3–4 teaching teams; align concrete-to-symbolic lesson materials.",
                first_observed="18 September 2026",
                last_updated="24 September 2026"
            ),
            # Signal 2: Persistent Difficulty after intervention
            SchoolSignal(
                id="SIG_PERS_READ_02",
                school_id="SCH_ZP_SHIRUR",
                type="PERSISTENT_DIFFICULTY",
                title="Persistent After-Intervention Difficulty: Reading Fluency",
                focus_skill="Paragraph Reading (Connected Fluency)",
                affected_classes=["Grade 3A", "Grade 3B"],
                affected_students_count=7,
                evidence_coverage_percentage=94.0,
                confidence="HIGH",
                status="under_review" if "SIG_PERS_READ_02" in review_map else "open",
                why_summary="7 students across two classes have completed ≥2 targeted fluency interventions, but post-activity evidence shows decoding speed remains below sentence-level threshold without significant gains.",
                suggested_action="Conduct targeted individual phonetic diagnostic checks to differentiate conjunct consonant decoding from whole-text pacing.",
                first_observed="19 September 2026",
                last_updated="24 September 2026"
            ),
            # Signal 3: Evidence Coverage Gap
            SchoolSignal(
                id="SIG_COV_G2B_03",
                school_id="SCH_ZP_SHIRUR",
                type="EVIDENCE_COVERAGE_GAP",
                title="Evidence Coverage Gap: Grade 2 — Section B",
                focus_skill="Foundational Numeracy & Literacy Baseline",
                affected_classes=["Grade 2B"],
                affected_students_count=13,
                evidence_coverage_percentage=53.6,
                confidence="HIGH",
                status="under_review" if "SIG_COV_G2B_03" in review_map else "open",
                why_summary="Only 15 of 28 enrolled learners (53.6%) have recorded assessment responses. Learning baseline is incomplete, preventing reliable classroom orchestration.",
                suggested_action="Support Grade 2B teacher with 2 dedicated 20-minute baseline assessment blocks to complete remaining 13 learner profiles.",
                first_observed="21 September 2026",
                last_updated="24 September 2026"
            ),
            # Signal 4: Positive Response Pattern
            SchoolSignal(
                id="SIG_POS_PVAL_04",
                school_id="SCH_ZP_SHIRUR",
                type="POSITIVE_RESPONSE_PATTERN",
                title="Positive Response Pattern: Concrete Place-Value Sequence",
                focus_skill="Place-Value Exchange in Regrouping",
                affected_classes=["Grade 3A", "Grade 3B"],
                affected_students_count=19,
                evidence_coverage_percentage=89.5,
                confidence="HIGH",
                status="under_review" if "SIG_POS_PVAL_04" in review_map else "open",
                why_summary="19 of 22 students who received instructional interventions utilizing the Concrete → Visual → Symbolic bundle sequence demonstrated verified performance gains (+35 to +50 percentage points) on post-check tasks.",
                suggested_action="Document bundle-and-sticks guided sequencing in the school instructional library for peer replication in Grade 4A.",
                first_observed="22 September 2026",
                last_updated="24 September 2026"
            )
        ]
        return signals

    def get_signal_evidence_detail(self, signal_id: str) -> SignalEvidence:
        """
        Detailed evidence traceability connecting Phase 1, Phase 2, Phase 3, Phase 4 (Section 10).
        """
        if signal_id == "SIG_REP_SUB_01":
            return SignalEvidence(
                id="EVID_REP_SUB_01",
                signal_id="SIG_REP_SUB_01",
                signal_title="Repeated Learning Gap: 2-Digit Subtraction",
                signal_type="REPEATED_LEARNING_PATTERN",
                focus_skill="2-Digit Subtraction with Regrouping",
                classes_breakdown=[
                    {
                        "class_id": "CLS_G3A",
                        "class_name": "Grade 3 — Section A",
                        "student_count": 8,
                        "status_distribution": {"demonstrated": 16, "emerging": 6, "not_yet": 2, "not_assessed": 2},
                        "sample_students": ["Aarav Sharma (ST001)", "Rohan Patil (ST003)", "Pooja Jadhav (ST007)"]
                    },
                    {
                        "class_id": "CLS_G3B",
                        "class_name": "Grade 3 — Section B",
                        "student_count": 11,
                        "status_distribution": {"demonstrated": 14, "emerging": 7, "not_yet": 4, "not_assessed": 2},
                        "sample_students": ["Mayur More (ST044)", "Gauri Raut (ST048)"]
                    },
                    {
                        "class_id": "CLS_G4A",
                        "class_name": "Grade 4 — Section A",
                        "student_count": 12,
                        "status_distribution": {"demonstrated": 17, "emerging": 6, "not_yet": 6, "not_assessed": 0},
                        "sample_students": ["Sagar Kamble (ST072)", "Vishal Shinde (ST075)"]
                    }
                ],
                overall_skill_status={
                    "demonstrated": 47,
                    "emerging": 19,
                    "not_yet": 12,
                    "not_assessed": 4
                },
                evidence_sources={
                    "Phase 1 (Assess)": "126 raw subtraction task responses across 3 classes",
                    "Phase 2 (Diagnose)": "18 diagnostic patterns flagged with prerequisite regrouping difficulty",
                    "Phase 3 (Orchestrate)": "3 active instructional paths focusing on place-value exchange",
                    "Phase 4 (Teach & Adapt)": "22 intervention episodes evaluated with before/after comparisons"
                },
                deterministic_calculation="31 of 82 evaluated learners (37.8%) across 3 classrooms classified as Emerging or Not Yet Demonstrated on 2-digit subtraction with regrouping tasks. Exceeds cross-class threshold (≥2 classes, ≥15 students).",
                traceable_items=[
                    {"source_id": "EV_RAW_SUB_001", "type": "Phase 1 Task Response", "detail": "ST001 answered '43 - 17 = 34' (smaller from larger inversion error)."},
                    {"source_id": "DIAG_PAT_SUB_G3A", "type": "Phase 2 Pattern", "detail": "Pattern ID PAT_NUM_SUB: Minuend tens decomposition difficulty."},
                    {"source_id": "PATH_G3A_A", "type": "Phase 3 Path", "detail": "Assigned Path A: Regrouping Foundation (6 learners in Grade 3A)."},
                    {"source_id": "INT_ST001_SUB", "type": "Phase 4 Post-Check", "detail": "Aarav Sharma post-check improved from 40% (2/5) to 80% (4/5) after concrete exchange."}
                ]
            )

        elif signal_id == "SIG_PERS_READ_02":
            return SignalEvidence(
                id="EVID_PERS_READ_02",
                signal_id="SIG_PERS_READ_02",
                signal_title="Persistent After-Intervention Difficulty: Reading Fluency",
                signal_type="PERSISTENT_DIFFICULTY",
                focus_skill="Paragraph Reading (Connected Fluency)",
                classes_breakdown=[
                    {
                        "class_id": "CLS_G3A",
                        "class_name": "Grade 3 — Section A",
                        "student_count": 4,
                        "status_distribution": {"demonstrated": 18, "emerging": 6, "not_yet": 4, "not_assessed": 2},
                        "sample_students": ["Tanvi Shinde (ST009)", "Aditya More (ST011)"]
                    },
                    {
                        "class_id": "CLS_G3B",
                        "class_name": "Grade 3 — Section B",
                        "student_count": 3,
                        "status_distribution": {"demonstrated": 16, "emerging": 8, "not_yet": 3, "not_assessed": 2},
                        "sample_students": ["Sunil Deshmukh (ST052)"]
                    }
                ],
                overall_skill_status={
                    "demonstrated": 51,
                    "emerging": 33,
                    "not_yet": 30,
                    "not_assessed": 4
                },
                evidence_sources={
                    "Phase 1 (Assess)": "Timed passage reading recordings and word-count logs",
                    "Phase 2 (Diagnose)": "Diagnostic hypotheses identifying multi-syllable word boundary hesitation",
                    "Phase 3 (Orchestrate)": "Assigned to Path B: Word Decoding",
                    "Phase 4 (Teach & Adapt)": "Post-intervention repeat checks show continuing syllable pausing"
                },
                deterministic_calculation="7 learners across 2 classrooms have completed ≥2 targeted fluency intervention cycles with post-check accuracy remaining <50% on connected paragraph text.",
                traceable_items=[
                    {"source_id": "EV_READ_FLU_ST009", "type": "Phase 1 Baseline", "detail": "ST009 read 18 words/min on grade-level Marathi paragraph."},
                    {"source_id": "INT_ST009_CYCLE1", "type": "Phase 4 Post-Check 1", "detail": "20 words/min after syllable isolation; continued pausing at conjuncts."},
                    {"source_id": "INT_ST009_CYCLE2", "type": "Phase 4 Post-Check 2", "detail": "21 words/min; remains in Emerging classification."}
                ]
            )

        elif signal_id == "SIG_COV_G2B_03":
            return SignalEvidence(
                id="EVID_COV_G2B_03",
                signal_id="SIG_COV_G2B_03",
                signal_title="Evidence Coverage Gap: Grade 2 — Section B",
                signal_type="EVIDENCE_COVERAGE_GAP",
                focus_skill="Foundational Numeracy & Literacy Baseline",
                classes_breakdown=[
                    {
                        "class_id": "CLS_G2B",
                        "class_name": "Grade 2 — Section B",
                        "student_count": 13,
                        "status_distribution": {"demonstrated": 8, "emerging": 4, "not_yet": 3, "not_assessed": 13},
                        "sample_students": ["13 unassessed learners"]
                    }
                ],
                overall_skill_status={
                    "demonstrated": 8,
                    "emerging": 4,
                    "not_yet": 3,
                    "not_assessed": 13
                },
                evidence_sources={
                    "Phase 1 (Assess)": "15 learner profiles completed; 13 profiles pending baseline stimulus administration",
                    "Phase 2 (Diagnose)": "Diagnostic analysis blocked due to incomplete baseline map",
                    "Phase 3 (Orchestrate)": "No classroom plan generated due to insufficient coverage (<60%)",
                    "Phase 4 (Teach & Adapt)": "0 intervention episodes"
                },
                deterministic_calculation="Grade 2B coverage is 53.6% (15 / 28 students assessed), which is below institutional validity threshold of 75.0%.",
                traceable_items=[
                    {"source_id": "COV_CLS_G2B", "type": "Enrollment Audit", "detail": "15 of 28 children completed oral literacy & numeracy assessments."}
                ]
            )

        else: # SIG_POS_PVAL_04
            return SignalEvidence(
                id="EVID_POS_PVAL_04",
                signal_id="SIG_POS_PVAL_04",
                signal_title="Positive Response Pattern: Concrete Place-Value Sequence",
                signal_type="POSITIVE_RESPONSE_PATTERN",
                focus_skill="Place-Value Exchange in Regrouping",
                classes_breakdown=[
                    {
                        "class_id": "CLS_G3A",
                        "class_name": "Grade 3 — Section A",
                        "student_count": 11,
                        "status_distribution": {"demonstrated": 9, "emerging": 2, "not_yet": 0, "not_assessed": 0},
                        "sample_students": ["Aarav Sharma (ST001)", "Rohan Patil (ST003)"]
                    },
                    {
                        "class_id": "CLS_G3B",
                        "class_name": "Grade 3 — Section B",
                        "student_count": 11,
                        "status_distribution": {"demonstrated": 8, "emerging": 1, "not_yet": 2, "not_assessed": 0},
                        "sample_students": ["Mayur More (ST044)", "Neha Shinde (ST046)"]
                    }
                ],
                overall_skill_status={
                    "demonstrated": 17,
                    "emerging": 3,
                    "not_yet": 2,
                    "not_assessed": 0
                },
                evidence_sources={
                    "Phase 1 (Assess)": "Initial baseline accuracy average: 36.4% on 2-digit subtraction",
                    "Phase 3 (Orchestrate)": "Assigned to Concrete Bundle & Stick path",
                    "Phase 4 (Teach & Adapt)": "Post-intervention accuracy average: 78.2% (+41.8 pts gain)"
                },
                deterministic_calculation="17 of 22 students (77.3%) demonstrated verified post-intervention accuracy ≥80% following the Concrete → Visual → Symbolic sequence.",
                traceable_items=[
                    {"source_id": "INT_ST001_SUB", "type": "Intervention Episode", "detail": "Aarav Sharma: 40% (2/5) -> 80% (4/5) after 10m bundle exchange."},
                    {"source_id": "INT_ST014_SUB", "type": "Intervention Episode", "detail": "Rohan Patil: 40% (2/5) -> 80% (4/5) after guided place-value exchange."},
                    {"source_id": "INT_ST044_SUB", "type": "Intervention Episode", "detail": "Mayur More: 20% (1/5) -> 60% (3/5) with bundle representation."}
                ]
            )

    def generate_school_evidence_brief(self, school_id: str = "SCH_ZP_SHIRUR") -> EvidenceBrief:
        """
        Synthesizes an institutional evidence brief grounded strictly in accumulated data (Sections 19 & 20).
        """
        reporting_period = "18–24 September 2026"
        coverage_summary = (
            "Across Zilla Parishad Primary School, school-wide assessment coverage increased from 68.3% to 83.1% "
            "(118 of 142 enrolled learners assessed). Grade 3 Section A (93.3%) and Grade 2 Section A (88.9%) have established "
            "comprehensive learning baselines."
        )
        repeated_patterns_summary = (
            "A structural learning gap in 2-Digit Subtraction with Regrouping has been confirmed across three classrooms: "
            "Grade 3A (8 students), Grade 3B (11 students), and Grade 4A (12 students), affecting 31 total learners. The error pattern "
            "is consistently characterized by unit subtraction inversion (smaller digit subtracted from larger digit regardless of position)."
        )
        intervention_response_summary = (
            "67 intervention episodes have been documented across 12 temporary instructional paths. 17 of 22 students receiving the "
            "Concrete → Visual → Symbolic place-value exchange intervention demonstrated post-activity gains (+35 to +50 percentage points), "
            "validating this instructional sequence as an observable positive pattern."
        )
        unresolved_areas_summary = (
            "7 students across Grades 3A and 3B continue to demonstrate persistent hesitation during connected paragraph reading despite "
            "completing two cycles of word-level decoding intervention. Further individual diagnostic checks are indicated."
        )
        evidence_gaps_summary = (
            "Grade 2 Section B currently exhibits an evidence coverage gap with only 15 of 28 learners (53.6%) assessed. "
            "Baseline data remains insufficient for automated classroom orchestration in this section."
        )
        suggested_review = (
            "1. Coordinate a joint Grade 3–4 teaching team review on two-digit subtraction place-value manipulatives.\n"
            "2. Allocate two 20-minute assessment coverage blocks to complete Grade 2B foundational profiles.\n"
            "3. Conduct targeted diagnostic investigations for the 7 unresolved reading fluency cases."
        )

        source_snapshot = {
            "total_students": 142,
            "assessed_students": 118,
            "coverage_pct": 83.1,
            "repeated_gap_students": 31,
            "positive_pattern_success_pct": 77.3,
            "unresolved_fluency_count": 7,
            "coverage_gap_unassessed": 13
        }

        return EvidenceBrief(
            id=f"BRIEF_{school_id}_{datetime.now().strftime('%Y%m%d')}",
            school_id=school_id,
            school_name="Zilla Parishad Primary School, Shirur",
            reporting_period=reporting_period,
            evidence_coverage_summary=coverage_summary,
            repeated_patterns_summary=repeated_patterns_summary,
            intervention_response_summary=intervention_response_summary,
            unresolved_areas_summary=unresolved_areas_summary,
            evidence_gaps_summary=evidence_gaps_summary,
            suggested_review=suggested_review,
            source_snapshot=source_snapshot
        )

    def record_school_review(
        self,
        signal_id: str,
        action: str,
        reviewer_id: str = "PRIN_001",
        assigned_to: Optional[str] = None,
        review_question: Optional[str] = None,
        due_date: Optional[str] = None,
        notes: Optional[str] = None
    ) -> SchoolReview:
        """
        Creates an administrative support review record (Section 22 & 23).
        """
        title_lookup = {
            "SIG_REP_SUB_01": "Repeated Learning Gap: 2-Digit Subtraction",
            "SIG_PERS_READ_02": "Persistent After-Intervention Difficulty: Reading Fluency",
            "SIG_COV_G2B_03": "Evidence Coverage Gap: Grade 2 — Section B",
            "SIG_POS_PVAL_04": "Positive Response Pattern: Concrete Place-Value Sequence"
        }
        review = SchoolReview(
            id=f"REV_{uuid.uuid4().hex[:8]}",
            signal_id=signal_id,
            signal_title=title_lookup.get(signal_id, "School Evidence Signal"),
            reviewer_id=reviewer_id,
            action=action, # type: ignore
            assigned_to=assigned_to or "Grade 3–4 Teaching Team",
            review_question=review_question or "Review the evidence underlying repeated difficulty with two-digit subtraction.",
            due_date=due_date or "30 September 2026",
            notes=notes,
            status="in_progress" if action == "assigned_follow_up" else "open",
            created_at=datetime.now().isoformat()
        )
        return review

school_intelligence_engine = SchoolIntelligenceEngine()
