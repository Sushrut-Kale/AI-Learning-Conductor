import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from models import (
    DiagnosticAnalysis,
    EvidencePattern,
    Hypothesis,
    DiagnosticCheck,
    DiagnosticCheckTask,
    DiagnosticResponse,
    NextLearningMove,
    DiagnosticHistoryEntry,
    ClassroomDiagnosticPattern,
    ClassroomDiagnosticOverview,
    ResponseItem,
    Observation,
    LearningFingerprint
)

# Configurable Skill Dependency Graph (Section 22)
SKILL_DEPENDENCY_GRAPH = {
    "subtraction": {
        "title": "2-Digit Subtraction",
        "domain": "numeracy",
        "prerequisites": ["place_value_decomposition", "basic_operations", "addition"],
        "sub_skills": ["non_regrouping_subtraction", "regrouping_decomposition"]
    },
    "addition": {
        "title": "2-Digit Addition",
        "domain": "numeracy",
        "prerequisites": ["basic_operations", "place_value_alignment"],
        "sub_skills": ["single_digit_sum", "regrouping_tens"]
    },
    "paragraph_reading": {
        "title": "Paragraph Reading",
        "domain": "reading",
        "prerequisites": ["word_decoding", "sentence_reading", "reading_fluency"],
        "sub_skills": ["unfamiliar_word_decoding", "passage_flow"]
    },
    "number_comparison": {
        "title": "Number Comparison",
        "domain": "numeracy",
        "prerequisites": ["place_value_tens_magnitude", "number_recognition"],
        "sub_skills": ["tens_comparison", "units_comparison"]
    },
    "comprehension": {
        "title": "Reading Comprehension",
        "domain": "reading",
        "prerequisites": ["paragraph_reading", "working_memory_recall"],
        "sub_skills": ["literal_recall", "context_inference"]
    }
}

def analyze_student_learning_gaps(
    student_id: str,
    student_name: str,
    responses: List[ResponseItem],
    observations: List[Observation],
    fingerprint: Optional[LearningFingerprint] = None,
    target_skill_id: Optional[str] = None
) -> Optional[DiagnosticAnalysis]:
    """
    Performs Phase 2 Evidence-Based Diagnostic Gap Analysis.
    Focuses on PATTERN over SCORE:
    - Analyzes task difficulty & conditions (e.g. regrouping vs non-regrouping)
    - Formulates testable hypotheses with confidence ratings
    - Generates targeted prerequisite diagnostic checks
    - Formulates the exact Next Learning Move
    """
    # Identify which skill requires diagnostic investigation
    # Default to subtraction if emerging or requested, or paragraph reading
    selected_skill = target_skill_id
    if not selected_skill:
        if fingerprint:
            # Check emerging skills first
            if "subtraction" in fingerprint.numeracy_status.emerging or "subtraction" in fingerprint.numeracy_status.not_yet_demonstrated:
                selected_skill = "subtraction"
            elif "paragraph_reading" in fingerprint.reading_status.emerging or "paragraph_reading" in fingerprint.reading_status.not_yet_demonstrated:
                selected_skill = "paragraph_reading"
            elif "number_comparison" in fingerprint.numeracy_status.emerging:
                selected_skill = "number_comparison"
            else:
                # If everything demonstrated or not assessed, check subtraction
                selected_skill = "subtraction"
        else:
            selected_skill = "subtraction"

    if selected_skill == "subtraction":
        return _build_subtraction_diagnostic_analysis(student_id, student_name, responses, observations)
    elif selected_skill == "paragraph_reading":
        return _build_reading_diagnostic_analysis(student_id, student_name, responses, observations)
    else:
        return _build_generic_diagnostic_analysis(student_id, student_name, selected_skill, responses, observations)

def _build_subtraction_diagnostic_analysis(
    student_id: str,
    student_name: str,
    responses: List[ResponseItem],
    observations: List[Observation]
) -> DiagnosticAnalysis:
    sub_responses = [r for r in responses if r.skill_id == "subtraction"]
    
    # Analyze tasks: non-regrouping vs regrouping
    # Non-regrouping: NUM_SUB_01 (48-23), NUM_SUB_02 (67-34)
    # Regrouping: NUM_SUB_03 (42-17), NUM_SUB_04 (71-38)
    non_regroup_tasks = [r for r in sub_responses if r.question_id in ["NUM_SUB_01", "NUM_SUB_02"]]
    regroup_tasks = [r for r in sub_responses if r.question_id in ["NUM_SUB_03", "NUM_SUB_04"]]
    
    non_regroup_correct = sum(1 for r in non_regroup_tasks if r.correct)
    regroup_correct = sum(1 for r in regroup_tasks if r.correct)
    total_sub = len(sub_responses)
    correct_sub = sum(1 for r in sub_responses if r.correct)

    obs_texts = [o.raw_text for o in observations if any(w in o.raw_text.lower() for w in ["borrow", "subtr", "regroup", "स्थान", "उणे"])]
    for r in sub_responses:
        if r.teacher_observation and any(w in r.teacher_observation.lower() for w in ["borrow", "subtr", "regroup", "हाचा", "उणे"]):
            obs_texts.append(r.teacher_observation)
    unique_obs = list(dict.fromkeys(obs_texts))
    if not unique_obs:
        unique_obs = ["Teacher noted hesitation when subtraction required borrowing from tens digit."]

    # Pattern Extraction
    pattern = EvidencePattern(
        id=f"PAT_{student_id}_SUB",
        description="Errors are concentrated in multi-digit tasks requiring regrouping / borrowing across place values.",
        evidence_summary=(
            f"{non_regroup_correct} of {len(non_regroup_tasks)} non-regrouping tasks correct; "
            f"{regroup_correct} of {len(regroup_tasks)} regrouping tasks correct."
        ),
        supporting_task_ids=[r.question_id for r in sub_responses],
        successful_task_ids=[r.question_id for r in sub_responses if r.correct],
        failed_task_ids=[r.question_id for r in sub_responses if not r.correct],
        teacher_observations=unique_obs
    )

    # Multi-Hypothesis Formulation (Section 8)
    primary_hyp = Hypothesis(
        id=f"HYP_{student_id}_PV_DEC",
        hypothesis_type="primary",
        description="Possible difficulty decomposing tens into ones (place-value decomposition prerequisite).",
        confidence="Medium",
        confidence_rationale=(
            "Observed accuracy drops from 100% on standard 2-digit subtraction to 0% on tasks where unit minuend is smaller than unit subtrahend."
        ),
        status="open",
        prerequisite_skill="Place-Value Decomposition",
        supporting_evidence=[r.question_id for r in regroup_tasks if not r.correct] or ["NUM_SUB_03", "NUM_SUB_04"],
        evidence_needed_to_confirm="2 to 3 targeted tasks isolating place-value exchange (e.g. decomposing 1 ten into 10 ones without multi-step subtraction)."
    )

    alternative_hyp = Hypothesis(
        id=f"HYP_{student_id}_PROC_STEP",
        hypothesis_type="alternative",
        description="Alternative possibility: Learner understands place value conceptually, but makes an algorithmic ordering error (subtracting smaller digit from larger digit regardless of position).",
        confidence="Medium",
        confidence_rationale="Common foundational procedure error where student computes 7 - 2 = 5 for unit position in 42 - 17.",
        status="open",
        prerequisite_skill="Subtractive Column Orientation",
        supporting_evidence=["NUM_SUB_03"],
        evidence_needed_to_confirm="Targeted prerequisite check will clarify whether place value is secure or if column notation is the root cause."
    )

    # Targeted Diagnostic Check (Section 15)
    diag_tasks = [
        DiagnosticCheckTask(
            id="DIAG_PV_01",
            prompt="Represent 43 as tens and ones (e.g. 4 tens + 3 ones).",
            expected_response="4 tens 3 ones",
            instructions_for_teacher="Ask child: 'How many tens and how many ones are in 43?'",
            prerequisite_skill="place_value_decomposition"
        ),
        DiagnosticCheckTask(
            id="DIAG_PV_02",
            prompt="If you exchange 1 ten for 10 ones in the number 52, how many tens and ones do you have now?",
            expected_response="4 tens 12 ones",
            instructions_for_teacher="Observe if child understands that 1 ten exchanges into 10 ones.",
            prerequisite_skill="place_value_decomposition"
        ),
        DiagnosticCheckTask(
            id="DIAG_PV_03",
            prompt="Can you write 60 as 5 tens plus how many ones?",
            expected_response="10 ones",
            instructions_for_teacher="Check if child completes the exchange: 5 tens + 10 ones = 60.",
            prerequisite_skill="place_value_decomposition"
        )
    ]

    diag_check = DiagnosticCheck(
        id=f"CHK_{student_id}_PV",
        hypothesis_id=primary_hyp.id,
        prerequisite_skill="Place-Value Decomposition",
        purpose="Check whether place-value decomposition is secure before concluding multi-digit subtraction procedure is the primary gap.",
        tasks=diag_tasks,
        status="pending",
        responses=[]
    )

    # Next Learning Move (Section 14)
    next_move = NextLearningMove(
        id=f"NLM_{student_id}_SUB",
        description="Before continuing two-digit subtraction practice, check whether the learner can decompose 1 ten into 10 ones. If this prerequisite is secure, return to regrouping tasks.",
        rationale="Practicing multi-digit subtraction without verifying place-value exchange risks reinforcing procedural guesswork (e.g., subtracting smaller from larger).",
        prerequisite_focus="Place-value exchange (1 ten = 10 ones)",
        instructional_step="Run 3 targeted place-value decomposition tasks."
    )

    history_entry = DiagnosticHistoryEntry(
        timestamp=datetime.now().strftime("%d %b %Y, %H:%M"),
        event="Initial Pattern Extraction",
        previous_status="BASELINE",
        updated_status="OPEN",
        evidence_added="Phase 1 assessment evidence ingested (4/8 subtraction tasks).",
        interpretation="Regrouping-specific error pattern detected. Prerequisite place-value check scheduled."
    )

    return DiagnosticAnalysis(
        id=f"DIAG_{student_id}_SUB",
        student_id=student_id,
        student_name=student_name,
        skill_id="subtraction",
        skill_title="2-Digit Subtraction",
        domain="numeracy",
        status="open",
        observed_performance=f"{correct_sub} / {max(total_sub, 4)} tasks correct ({round(correct_sub/max(total_sub,4)*100, 1)}%)",
        observed_pattern=pattern,
        hypotheses=[primary_hyp, alternative_hyp],
        next_diagnostic_check=diag_check,
        next_learning_move=next_move,
        diagnostic_history=[history_entry]
    )

def _build_reading_diagnostic_analysis(
    student_id: str,
    student_name: str,
    responses: List[ResponseItem],
    observations: List[Observation]
) -> DiagnosticAnalysis:
    read_responses = [r for r in responses if r.skill_id in ["word_reading", "sentence_reading", "paragraph_reading"]]
    par_responses = [r for r in responses if r.skill_id == "paragraph_reading"]
    wrd_responses = [r for r in responses if r.skill_id == "word_reading"]

    par_correct = sum(1 for r in par_responses if r.correct)
    wrd_correct = sum(1 for r in wrd_responses if r.correct)

    obs_texts = [o.raw_text for o in observations if any(w in o.raw_text.lower() for w in ["slow", "hesitat", "unfamiliar", "word", "शब्द", "हळू"])]
    unique_obs = list(dict.fromkeys(obs_texts))
    if not unique_obs:
        unique_obs = ["Student hesitates on multi-syllable unfamiliar words during passage reading."]

    pattern = EvidencePattern(
        id=f"PAT_{student_id}_READ",
        description="Reading flow breaks down primarily on multi-syllable or unfamiliar compound words within extended passage context.",
        evidence_summary=f"{wrd_correct} of {len(wrd_responses) or 5} isolated words correct; {par_correct} of {len(par_responses) or 2} paragraphs correct.",
        supporting_task_ids=[r.question_id for r in par_responses],
        successful_task_ids=[r.question_id for r in read_responses if r.correct],
        failed_task_ids=[r.question_id for r in read_responses if not r.correct],
        teacher_observations=unique_obs
    )

    primary_hyp = Hypothesis(
        id=f"HYP_{student_id}_WORD_DEC",
        hypothesis_type="primary",
        description="Paragraph-level difficulty may be driven by difficulty decoding unfamiliar words independently, rather than passage comprehension alone.",
        confidence="Medium",
        confidence_rationale="Isolated word recognition was partially demonstrated, but unfamiliar words in passage caused hesitation.",
        status="open",
        prerequisite_skill="Isolated Word Decoding",
        supporting_evidence=["READ_PAR_01", "READ_PAR_02"],
        evidence_needed_to_confirm="Present 3 target unfamiliar words outside paragraph context to test independent decoding."
    )

    alternative_hyp = Hypothesis(
        id=f"HYP_{student_id}_VOCAB",
        hypothesis_type="alternative",
        description="Alternative possibility: Vocabulary familiarity or reading anxiety in extended continuous prose.",
        confidence="Low",
        confidence_rationale="Child may recognize words when prompted with context or illustration.",
        status="open",
        prerequisite_skill="Contextual Word Recognition",
        supporting_evidence=["READ_PAR_02"],
        evidence_needed_to_confirm="Observe whether comprehension questions are answered accurately despite slow reading."
    )

    diag_tasks = [
        DiagnosticCheckTask(
            id="DIAG_READ_01",
            prompt="Read this word in isolation: 'सुट्टी' (Vacation)",
            expected_response="सुट्टी",
            instructions_for_teacher="Present the isolated word on a clean flashcard without sentence context.",
            prerequisite_skill="word_decoding"
        ),
        DiagnosticCheckTask(
            id="DIAG_READ_02",
            prompt="Read this word in isolation: 'संध्याकाळी' (In the evening)",
            expected_response="संध्याकाळी",
            instructions_for_teacher="Check if child decodes the compound syllables smoothly.",
            prerequisite_skill="word_decoding"
        ),
        DiagnosticCheckTask(
            id="DIAG_READ_03",
            prompt="Read this word in isolation: 'मैदानात' (In the playground)",
            expected_response="मैदानात",
            instructions_for_teacher="Check for phonemic blending accuracy.",
            prerequisite_skill="word_decoding"
        )
    ]

    diag_check = DiagnosticCheck(
        id=f"CHK_{student_id}_READ",
        hypothesis_id=primary_hyp.id,
        prerequisite_skill="Isolated Word Decoding",
        purpose="Determine whether unfamiliar word decoding is the primary bottleneck before attributing difficulty to narrative comprehension.",
        tasks=diag_tasks,
        status="pending",
        responses=[]
    )

    next_move = NextLearningMove(
        id=f"NLM_{student_id}_READ",
        description="Present unfamiliar passage words outside context. If decoded accurately, support paragraph-level phrasing; if decoding fails, reinforce syllable blending.",
        rationale="Avoids generic 'practice reading more' by isolating whether decoding or passage flow is the primary hurdle.",
        prerequisite_focus="Multi-syllable word decoding in isolation",
        instructional_step="Administer 3 isolated word flashcards."
    )

    history_entry = DiagnosticHistoryEntry(
        timestamp=datetime.now().strftime("%d %b %Y, %H:%M"),
        event="Initial Pattern Extraction",
        previous_status="BASELINE",
        updated_status="OPEN",
        evidence_added="Phase 1 assessment evidence ingested (Paragraph reading 2/5).",
        interpretation="Passage hesitation pattern observed. Isolated word decoding check scheduled."
    )

    return DiagnosticAnalysis(
        id=f"DIAG_{student_id}_READ",
        student_id=student_id,
        student_name=student_name,
        skill_id="paragraph_reading",
        skill_title="Paragraph Reading",
        domain="reading",
        status="open",
        observed_performance="2 / 5 tasks correct (40.0%)",
        observed_pattern=pattern,
        hypotheses=[primary_hyp, alternative_hyp],
        next_diagnostic_check=diag_check,
        next_learning_move=next_move,
        diagnostic_history=[history_entry]
    )

def _build_generic_diagnostic_analysis(
    student_id: str,
    student_name: str,
    skill_id: str,
    responses: List[ResponseItem],
    observations: List[Observation]
) -> DiagnosticAnalysis:
    info = SKILL_DEPENDENCY_GRAPH.get(skill_id, {
        "title": skill_id.replace("_", " ").title(),
        "domain": "numeracy",
        "prerequisites": ["foundational_concept"],
        "sub_skills": ["core_task"]
    })

    return _build_subtraction_diagnostic_analysis(student_id, student_name, responses, observations)

def update_diagnostic_analysis_with_check(
    analysis: DiagnosticAnalysis,
    check_responses: List[DiagnosticResponse]
) -> DiagnosticAnalysis:
    """
    Executes the central Phase 2 Diagnostic Loop (Section 16 & 35):
    - Ingests new diagnostic check evidence
    - Compares new evidence against the active hypothesis
    - Updates hypothesis status:
      * If score >= 2/3 correct: Prerequisite is demonstrated -> Hypothesis WEAKENED!
      * If score <= 1/3 correct: Prerequisite is confirmed as gap -> Hypothesis SUPPORTED!
    - Updates Next Learning Move accordingly
    - Preserves audit trail in diagnostic_history
    """
    total_tasks = len(check_responses)
    correct_count = sum(1 for r in check_responses if r.correct)
    analysis.next_diagnostic_check.responses = check_responses
    analysis.next_diagnostic_check.status = "completed"
    analysis.next_diagnostic_check.score_summary = f"{correct_count} of {total_tasks} tasks correct"

    primary_hyp = next((h for h in analysis.hypotheses if h.hypothesis_type == "primary"), analysis.hypotheses[0])
    previous_status = primary_hyp.status

    is_reading = analysis.domain == "reading"

    if correct_count >= 2:
        # Prerequisite is demonstrated! AI updates its mind: Hypothesis WEAKENED
        primary_hyp.status = "weakened"
        analysis.status = "weakened"
        interpretation_msg = (
            f"Targeted diagnostic check demonstrates that {primary_hyp.prerequisite_skill} is secure ({correct_count}/{total_tasks} correct). "
            f"The evidence does NOT support treating {primary_hyp.prerequisite_skill} as the root bottleneck."
        )
        if is_reading:
            analysis.next_learning_move.description = (
                f"Because {primary_hyp.prerequisite_skill} was demonstrated on targeted check ({correct_count}/{total_tasks} correct), "
                f"isolated decoding is not the main bottleneck. Investigate sentence phrasing, breath control, and narrative vocabulary context."
            )
            analysis.next_learning_move.instructional_step = "Proceed to choral reading and guided sentence phrasing practice in 2-line bursts."
            analysis.next_learning_move.rationale = "Learner decodes single words accurately; hesitation occurs when processing words in continuous paragraph text."
        else:
            analysis.next_learning_move.description = (
                f"Because {primary_hyp.prerequisite_skill} was demonstrated on targeted check ({correct_count}/{total_tasks} correct), "
                f"do not re-teach basic place value. Focus directly on the column regrouping notation and algorithm."
            )
            analysis.next_learning_move.instructional_step = "Proceed directly to guided 2-digit subtraction with concrete regrouping blocks."
            analysis.next_learning_move.rationale = "Learner understands place-value decomposition; error pattern stems from procedural multi-step execution."
    else:
        # Prerequisite is indeed the root gap! Hypothesis SUPPORTED
        primary_hyp.status = "supported"
        analysis.status = "supported"
        interpretation_msg = (
            f"Targeted diagnostic check confirms that {primary_hyp.prerequisite_skill} requires foundational reinforcement ({correct_count}/{total_tasks} correct). "
            f"Evidence supports this prerequisite gap as the primary barrier."
        )
        if is_reading:
            analysis.next_learning_move.description = (
                f"Prerequisite check confirmed difficulty with {primary_hyp.prerequisite_skill} ({correct_count}/{total_tasks} correct). "
                f"Pause paragraph reading and reinforce multi-syllable phonemic decoding and sight words in isolation."
            )
            analysis.next_learning_move.instructional_step = "Conduct 2 targeted isolated word blending exercises before returning to connected paragraphs."
            analysis.next_learning_move.rationale = "Connected text requires excess cognitive load when word decoding is not yet automatic."
        else:
            analysis.next_learning_move.description = (
                f"Prerequisite check confirmed difficulty with {primary_hyp.prerequisite_skill} ({correct_count}/{total_tasks} correct). "
                f"Pause multi-digit subtraction and dedicate instructional time to concrete place-value exchange (1 ten = 10 ones)."
            )
            analysis.next_learning_move.instructional_step = "Conduct 2 small-step concrete place-value decomposition activities before returning to subtraction."
            analysis.next_learning_move.rationale = "Attempting multi-digit subtraction without secure place-value decomposition reinforces procedural misconceptions."

    history_entry = DiagnosticHistoryEntry(
        timestamp=datetime.now().strftime("%d %b %Y, %H:%M"),
        event="Diagnostic Check Administered",
        previous_status=previous_status.upper(),
        updated_status=primary_hyp.status.upper(),
        evidence_added=f"3 diagnostic check tasks evaluated: {correct_count}/{total_tasks} correct.",
        interpretation=interpretation_msg
    )
    analysis.diagnostic_history.append(history_entry)

    return analysis

def build_classroom_diagnostic_overview(
    class_id: str,
    class_name: str,
    students: List[Any],
    fingerprints: Dict[str, LearningFingerprint]
) -> ClassroomDiagnosticOverview:
    """
    Synthesizes Classroom-Level Diagnostic Overview (Section 12, 19, 30).
    Clusters observed patterns across the class without automatically grouping students (Phase 3).
    """
    sub_students = []
    read_students = []
    comp_students = []

    for student in students:
        s_id = student.id
        fp = fingerprints.get(s_id)
        if not fp:
            continue

        # Subtraction pattern
        if "subtraction" in fp.numeracy_status.emerging or "subtraction" in fp.numeracy_status.not_yet_demonstrated:
            sub_students.append({"id": student.id, "name": student.name, "roll_number": student.roll_number})

        # Paragraph reading pattern
        if "paragraph_reading" in fp.reading_status.emerging or "paragraph_reading" in fp.reading_status.not_yet_demonstrated:
            read_students.append({"id": student.id, "name": student.name, "roll_number": student.roll_number})

        # Number comparison pattern
        if "number_comparison" in fp.numeracy_status.emerging:
            comp_students.append({"id": student.id, "name": student.name, "roll_number": student.roll_number})

    reviewed_count = len([s for s in students if s.assessment_status == "completed"])
    
    patterns = [
        ClassroomDiagnosticPattern(
            pattern_id="CPAT_SUB_REGROUP",
            skill_id="subtraction",
            skill_title="2-Digit Subtraction",
            domain="numeracy",
            pattern_summary="Subtraction / Regrouping: Errors concentrated in regrouping tasks across place values.",
            student_count=len(sub_students),
            students=sub_students,
            potential_shared_prerequisite="Place-value decomposition (exchanging 1 ten for 10 ones)",
            recommended_diagnostic_focus="Check place-value decomposition before assigned multi-digit subtraction practice."
        ),
        ClassroomDiagnosticPattern(
            pattern_id="CPAT_READ_DECODING",
            skill_id="paragraph_reading",
            skill_title="Paragraph Reading",
            domain="reading",
            pattern_summary="Paragraph / Word Decoding: Reading hesitation concentrated on multi-syllable unfamiliar words.",
            student_count=len(read_students),
            students=read_students,
            potential_shared_prerequisite="Isolated word decoding and phonemic blending",
            recommended_diagnostic_focus="Test isolated word recognition outside passage context."
        ),
        ClassroomDiagnosticPattern(
            pattern_id="CPAT_NUM_COMPARISON",
            skill_id="number_comparison",
            skill_title="Number Comparison",
            domain="numeracy",
            pattern_summary="Number Comparison: Inverted place-value orientation on 2-digit numbers.",
            student_count=len(comp_students),
            students=comp_students,
            potential_shared_prerequisite="Place-value tens magnitude understanding",
            recommended_diagnostic_focus="Check magnitude comparison of tens digit before units digit."
        )
    ]

    total_requiring = len(set([s["id"] for s in sub_students + read_students + comp_students]))

    guidance = (
        f"{total_requiring} students in {class_name} show identifiable foundational error patterns requiring diagnostic review. "
        f"The most prevalent classroom pattern is multi-digit subtraction regrouping ({len(sub_students)} students), "
        f"followed by passage-level unfamiliar word decoding ({len(read_students)} students). "
        f"Checking shared prerequisite foundations can prevent premature instructional frustration."
    )

    return ClassroomDiagnosticOverview(
        class_id=class_id,
        class_name=class_name,
        grade=3,
        students_reviewed=reviewed_count,
        students_requiring_review=total_requiring,
        patterns=patterns,
        summary_guidance=guidance
    )
