import { localDb, LocalResponse, LocalObservation } from './db';

// API base URL: configurable via VITE_API_BASE_URL for production deployment
// In development with Vite proxy, this resolves to /api → http://localhost:8000/api
// In production, set VITE_API_BASE_URL=https://your-backend.com in .env.local
const _apiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = _apiBase ? `${_apiBase}/api` : '/api';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';


export interface AssessmentItem {
  id: string;
  assessment_id: string;
  domain: 'reading' | 'numeracy';
  skill_id: string;
  skill_title: string;
  question_stimulus: string;
  stimulus_type: string;
  expected_response: string;
  options?: string[];
  instructions_for_teacher: string;
  difficulty_level: number;
}

export interface Assessment {
  id: string;
  title: string;
  grade: number;
  language: string;
  domain: 'reading' | 'numeracy';
  framework: string;
  skills: { id: string; title: string }[];
  items: AssessmentItem[];
}

export interface SkillEvidence {
  skill_id: string;
  skill_title: string;
  domain: 'reading' | 'numeracy';
  correct: number;
  total: number;
  percentage: number;
  status: 'demonstrated' | 'emerging' | 'not_yet_demonstrated' | 'not_assessed';
  question_results: {
    question_id: string;
    stimulus: string;
    expected_response: string;
    student_response: string;
    correct: boolean;
    teacher_observation?: string;
  }[];
}

export interface LearningFingerprint {
  id: string;
  student_id: string;
  student_name: string;
  grade: number;
  language: string;
  assessment_date: string;
  confidence: 'High' | 'Medium' | 'Low';
  reading_status: {
    demonstrated: string[];
    emerging: string[];
    not_yet_demonstrated: string[];
    not_assessed: string[];
  };
  numeracy_status: {
    demonstrated: string[];
    emerging: string[];
    not_yet_demonstrated: string[];
    not_assessed: string[];
  };
  evidence_breakdown: SkillEvidence[];
  teacher_observations_summary: string[];
  structured_observations: {
    observation_type: string;
    raw_text: string;
    tags: string[];
    source: string;
  }[];
  ai_summary_narrative: string;
  teacher_verified: boolean;
  teacher_notes?: string;
  generated_at: string;
}

export interface ClassroomLearningMap {
  class_id: string;
  class_name: string;
  grade: number;
  language: string;
  total_students: number;
  assessed_count: number;
  in_progress_count: number;
  not_assessed_count: number;
  reading_matrix: {
    skill_id: string;
    skill_title: string;
    domain: 'reading';
    demonstrated_count: number;
    emerging_count: number;
    not_yet_count: number;
    not_assessed_count: number;
    students_demonstrated: string[];
    students_emerging: string[];
    students_not_yet: string[];
    students_not_assessed: string[];
  }[];
  numeracy_matrix: {
    skill_id: string;
    skill_title: string;
    domain: 'numeracy';
    demonstrated_count: number;
    emerging_count: number;
    not_yet_count: number;
    not_assessed_count: number;
    students_demonstrated: string[];
    students_emerging: string[];
    students_not_yet: string[];
    students_not_assessed: string[];
  }[];
  summary_insight: string;
}

class ApiService {
  private isSimulatedOffline: boolean = false;

  setSimulatedOffline(val: boolean) {
    this.isSimulatedOffline = val;
  }

  isOffline(): boolean {
    return this.isSimulatedOffline || !navigator.onLine;
  }

  async getHealth() {
    if (this.isOffline()) {
      return { status: 'offline', llm_engine: 'Offline Local Cache' };
    }
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }

  async getClasses() {
    if (this.isOffline()) {
      const cached = await localDb.classes.toArray();
      if (cached.length > 0) return cached;
    }
    try {
      const res = await fetch(`${API_BASE}/classes`);
      const data = await res.json();
      // Cache locally
      await localDb.classes.bulkPut(data);
      return data;
    } catch (e) {
      return await localDb.classes.toArray();
    }
  }

  async getClassDetails(classId: string) {
    try {
      if (!this.isOffline()) {
        const res = await fetch(`${API_BASE}/classes/${classId}`);
        const data = await res.json();
        // Cache students locally
        if (data.students) {
          await localDb.students.bulkPut(data.students);
        }
        return data;
      }
    } catch (e) {
      console.warn('Network fetch failed, using local offline store', e);
    }
    const students = await localDb.students.where('class_id').equals(classId).toArray();
    const classInfo = await localDb.classes.get(classId);
    return {
      class_info: classInfo,
      students
    };
  }

  async getAssessments(): Promise<Assessment[]> {
    try {
      if (!this.isOffline()) {
        const res = await fetch(`${API_BASE}/assessments`);
        return await res.json();
      }
    } catch (e) {
      console.warn('Using offline assessment content', e);
    }
    // Fallback: return default assessment if offline
    return [];
  }

  async getStudentProfile(studentId: string) {
    try {
      if (!this.isOffline()) {
        const res = await fetch(`${API_BASE}/students/${studentId}`);
        const data = await res.json();
        if (data.fingerprint) {
          await localDb.fingerprints.put({ ...data.fingerprint, synced: true });
        }
        return data;
      }
    } catch (e) {
      console.warn('Network error, fetching from local DB', e);
    }
    const student = await localDb.students.get(studentId);
    const fp = await localDb.fingerprints.get(`FP_${studentId}`);
    const responses = await localDb.responses.where('student_id').equals(studentId).toArray();
    return {
      student,
      fingerprint: fp,
      total_responses: responses.length,
      total_observations: 0
    };
  }

  async submitAssessmentSession(payload: {
    student_id: string;
    responses: any[];
    observations: any[];
  }) {
    // Save to local IndexedDB immediately
    const localResponses: LocalResponse[] = payload.responses.map(r => ({
      ...r,
      synced: !this.isOffline()
    }));
    await localDb.responses.bulkPut(localResponses);

    // Update student local status
    const student = await localDb.students.get(payload.student_id);
    if (student) {
      student.assessment_status = 'completed';
      await localDb.students.put(student);
    }

    if (this.isOffline()) {
      // Add to sync queue
      await localDb.syncQueue.add({
        type: 'response',
        payload,
        created_at: new Date().toISOString()
      });
      // Generate heuristic offline fingerprint locally
      return {
        status: 'saved_offline',
        student_id: payload.student_id,
        assessment_status: 'completed',
        offline: true
      };
    }

    // Call server
    const res = await fetch(`${API_BASE}/assessments/submit-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.fingerprint) {
      await localDb.fingerprints.put({ ...data.fingerprint, synced: true });
    }
    return data;
  }

  async teacherOverride(studentId: string, override: {
    skill_id: string;
    domain: 'reading' | 'numeracy';
    new_status: string;
    teacher_note: string;
  }) {
    if (this.isOffline()) {
      await localDb.syncQueue.add({
        type: 'fingerprint_override',
        payload: { student_id: studentId, ...override },
        created_at: new Date().toISOString()
      });
      return { status: 'queued_offline' };
    }
    const res = await fetch(`${API_BASE}/students/${studentId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        ...override
      })
    });
    return res.json();
  }

  async getEvidence(studentId: string) {
    if (!this.isOffline()) {
      try {
        const res = await fetch(`${API_BASE}/students/${studentId}/evidence`);
        return await res.json();
      } catch (e) {
        console.warn('Fetching evidence offline', e);
      }
    }
    const student = await localDb.students.get(studentId);
    const fp = await localDb.fingerprints.get(`FP_${studentId}`);
    const responses = await localDb.responses.where('student_id').equals(studentId).toArray();
    return {
      student,
      confidence: fp?.confidence || 'Medium',
      evidence_breakdown: fp?.evidence_breakdown || [],
      raw_responses: responses,
      observations: []
    };
  }

  async getClassroomLearningMap(classId: string): Promise<ClassroomLearningMap> {
    if (!this.isOffline()) {
      try {
        const res = await fetch(`${API_BASE}/classes/${classId}/learning-map`);
        return await res.json();
      } catch (e) {
        console.warn('Network error fetching learning map', e);
      }
    }
    throw new Error('Classroom learning map requires online sync or cached assessment map.');
  }

  async processSyncQueue(): Promise<{ synced_count: number }> {
    const queue = await localDb.syncQueue.toArray();
    if (queue.length === 0) return { synced_count: 0 };

    let count = 0;
    for (const item of queue) {
      try {
        if (item.type === 'response') {
          await fetch(`${API_BASE}/assessments/submit-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
        } else if (item.type === 'fingerprint_override') {
          await fetch(`${API_BASE}/students/${item.payload.student_id}/override`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
        }
        if (item.id) await localDb.syncQueue.delete(item.id);
        count++;
      } catch (err) {
        console.error('Failed to sync queue item:', item, err);
        break; // Stop and retry later if network still fails
      }
    }
    return { synced_count: count };
  }

  async getSyncQueueCount(): Promise<number> {
    return await localDb.syncQueue.count();
  }

  async resetDemoData() {
    await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
    await localDb.classes.clear();
    await localDb.students.clear();
    await localDb.fingerprints.clear();
    await localDb.responses.clear();
    await localDb.syncQueue.clear();
  }

  // ============================================================
  // PHASE 2: DIAGNOSTIC & NEXT LEARNING MOVE METHODS
  // ============================================================

  async getStudentDiagnostics(studentId: string, skillId?: string): Promise<DiagnosticAnalysis> {
    const url = skillId 
      ? `${API_BASE}/students/${studentId}/diagnostics?skill_id=${skillId}`
      : `${API_BASE}/students/${studentId}/diagnostics`;
    
    if (this.isOffline()) {
      // Local fallback
      const cached = localStorage.getItem(`DIAG_${studentId}`);
      if (cached) return JSON.parse(cached);
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Diagnostic fetch failed');
      const data = await res.json();
      localStorage.setItem(`DIAG_${studentId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`DIAG_${studentId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async submitDiagnosticCheck(studentId: string, payload: { skill_id?: string; responses: any[] }): Promise<any> {
    if (this.isOffline()) {
      await localDb.syncQueue.add({
        type: 'response',
        payload: { studentId, ...payload },
        created_at: new Date().toISOString()
      });
      return { status: 'queued_offline' };
    }

    const res = await fetch(`${API_BASE}/diagnostics/${studentId}/checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.analysis) {
      localStorage.setItem(`DIAG_${studentId}`, JSON.stringify(data.analysis));
    }
    return data;
  }

  async overrideDiagnosticHypothesis(studentId: string, payload: { skill_id?: string; action: string; teacher_note: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/diagnostics/${studentId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.analysis) {
      localStorage.setItem(`DIAG_${studentId}`, JSON.stringify(data.analysis));
    }
    return data;
  }

  async getClassroomDiagnosticOverview(classId: string): Promise<ClassroomDiagnosticOverview> {
    const res = await fetch(`${API_BASE}/classes/${classId}/diagnostic-overview`);
    return await res.json();
  }

  // ============================================================
  // PHASE 3 — CLASSROOM ORCHESTRATION METHODS
  // ============================================================

  async getClassroomOrchestration(classId: string): Promise<ClassroomOrchestrationOverview> {
    try {
      const res = await fetch(`${API_BASE}/classes/${classId}/orchestration`);
      if (!res.ok) throw new Error('Orchestration overview fetch failed');
      const data = await res.json();
      localStorage.setItem(`ORCH_OVERVIEW_${classId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`ORCH_OVERVIEW_${classId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async buildClassroomOrchestration(classId: string, req: OrchestrationBuildRequest): Promise<ClassroomPlan> {
    const res = await fetch(`${API_BASE}/classes/${classId}/orchestration/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    const plan = await res.json();
    localStorage.setItem(`PLAN_${plan.id}`, JSON.stringify(plan));
    localStorage.setItem(`LATEST_PLAN_${classId}`, JSON.stringify(plan));
    return plan;
  }

  async getOrchestrationPlan(planId: string): Promise<ClassroomPlan> {
    try {
      const res = await fetch(`${API_BASE}/orchestration/${planId}`);
      if (!res.ok) throw new Error('Plan fetch failed');
      const data = await res.json();
      localStorage.setItem(`PLAN_${planId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`PLAN_${planId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async updateOrchestrationPlan(planId: string, updates: any): Promise<ClassroomPlan> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    localStorage.setItem(`PLAN_${planId}`, JSON.stringify(updated));
    return updated;
  }

  async approveOrchestrationPlan(planId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}/approve`, {
      method: 'POST'
    });
    return await res.json();
  }

  async startLiveClassroom(planId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}/start`, {
      method: 'POST'
    });
    return await res.json();
  }

  async recordLessonEvidence(planId: string, evidence: LessonEvidenceItem[], notes?: string): Promise<ClassroomPlan> {
    if (this.isOffline()) {
      await localDb.syncQueue.add({
        type: 'response',
        payload: { planId, evidence, notes },
        created_at: new Date().toISOString()
      });
      const cached = localStorage.getItem(`PLAN_${planId}`);
      if (cached) {
        const plan = JSON.parse(cached);
        plan.evidence_records.push(...evidence);
        localStorage.setItem(`PLAN_${planId}`, JSON.stringify(plan));
        return plan;
      }
    }

    const res = await fetch(`${API_BASE}/orchestration/${planId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, evidence, session_notes: notes })
    });
    const updated = await res.json();
    localStorage.setItem(`PLAN_${planId}`, JSON.stringify(updated));
    return updated;
  }

  async completeLessonSession(planId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}/complete`, {
      method: 'POST'
    });
    return await res.json();
  }

  async getLessonReview(planId: string): Promise<LessonReviewData> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}/review`);
    return await res.json();
  }

  async updateDiagnosticsFromOrchestration(planId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orchestration/${planId}/update-diagnostics`, {
      method: 'POST'
    });
    return await res.json();
  }

  // Phase 4: Teach, Observe & Adapt
  async getTeachAndAdaptOverview(classId: string): Promise<TeachAndAdaptOverview> {
    try {
      const res = await fetch(`${API_BASE}/teach/class/${classId}`);
      if (!res.ok) throw new Error('Overview fetch failed');
      const data = await res.json();
      localStorage.setItem(`TEACH_OVERVIEW_${classId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`TEACH_OVERVIEW_${classId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getInterventionSession(sessionId: string): Promise<InterventionSession> {
    try {
      const res = await fetch(`${API_BASE}/interventions/${sessionId}`);
      if (!res.ok) throw new Error('Session fetch failed');
      const data = await res.json();
      localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`INTERVENTION_${sessionId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getStudentIntervention(studentId: string): Promise<InterventionSession> {
    try {
      const res = await fetch(`${API_BASE}/interventions/student/${studentId}`);
      if (!res.ok) throw new Error('Student intervention fetch failed');
      const data = await res.json();
      localStorage.setItem(`INTERVENTION_STUDENT_${studentId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`INTERVENTION_STUDENT_${studentId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async startInterventionSession(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/start`, { method: 'POST' });
    return await res.json();
  }

  async advanceInterventionStep(sessionId: string, stepIndex?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_index: stepIndex })
    });
    return await res.json();
  }

  async recordInterventionObservation(sessionId: string, rawText: string, source: string = 'voice'): Promise<InterventionSession> {
    if (this.isOffline()) {
      await localDb.syncQueue.add({
        type: 'observation',
        payload: { sessionId, rawText, source },
        created_at: new Date().toISOString()
      });
      const cached = localStorage.getItem(`INTERVENTION_${sessionId}`);
      if (cached) {
        const sess = JSON.parse(cached);
        sess.observations.push({
          id: `OBS_LOCAL_${Date.now()}`,
          raw_text: rawText,
          structured_observation: { note: rawText, status_signal: 'Offline saved' },
          source
        });
        localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(sess));
        return sess;
      }
    }
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/observation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, source })
    });
    const updated = await res.json();
    localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(updated));
    return updated;
  }

  async recordInterventionMultimodal(sessionId: string, fileRef: string, evidenceType: string = 'slate'): Promise<InterventionSession> {
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/multimodal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_reference: fileRef, evidence_type: evidenceType })
    });
    const updated = await res.json();
    localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(updated));
    return updated;
  }

  async recordInterventionPostCheck(sessionId: string, items: InterventionEvidence[]): Promise<InterventionSession> {
    if (this.isOffline()) {
      await localDb.syncQueue.add({
        type: 'response',
        payload: { sessionId, items },
        created_at: new Date().toISOString()
      });
    }
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/post-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const updated = await res.json();
    localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(updated));
    return updated;
  }

  async recordAdaptationDecision(sessionId: string, decision: 'accepted' | 'modified' | 'rejected', notes?: string): Promise<InterventionSession> {
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes })
    });
    const updated = await res.json();
    localStorage.setItem(`INTERVENTION_${sessionId}`, JSON.stringify(updated));
    return updated;
  }

  async getStudentLearningTrajectory(studentId: string): Promise<StudentLearningTrajectory> {
    const res = await fetch(`${API_BASE}/students/${studentId}/trajectory`);
    return await res.json();
  }

  async updateDiagnosticsFromIntervention(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions/${sessionId}/update-diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await res.json();
  }

  async prepareNextLessonHandoff(classId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teach/class/${classId}/next-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await res.json();
  }

  // Phase 5: School Intelligence & Early-Support Signals
  async getSchoolIntelligenceOverview(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<SchoolIntelligenceOverview> {
    try {
      const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}`);
      if (!res.ok) throw new Error('School Intelligence fetch failed');
      const data = await res.json();
      localStorage.setItem(`SCHOOL_INTELLIGENCE_${schoolId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`SCHOOL_INTELLIGENCE_${schoolId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getSchoolSignals(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<SchoolSignal[]> {
    const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}/signals`);
    return await res.json();
  }

  async getSignalEvidence(signalId: string): Promise<SignalEvidence> {
    const res = await fetch(`${API_BASE}/school-intelligence/signals/${signalId}/evidence`);
    return await res.json();
  }

  async recordSchoolReview(
    signalId: string,
    action: string,
    reviewerId: string = 'PRIN_001',
    assignedTo?: string,
    reviewQuestion?: string,
    dueDate?: string,
    notes?: string
  ): Promise<SchoolReview> {
    const res = await fetch(`${API_BASE}/school-intelligence/signals/${signalId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reviewer_id: reviewerId,
        assigned_to: assignedTo,
        review_question: reviewQuestion,
        due_date: dueDate,
        notes
      })
    });
    return await res.json();
  }

  async getSchoolLandscape(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<any> {
    const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}/landscape`);
    return await res.json();
  }

  async getSchoolInterventionPatterns(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<InstructionalPattern[]> {
    const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}/intervention-patterns`);
    return await res.json();
  }

  async generateSchoolEvidenceBrief(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<EvidenceBrief> {
    const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}/generate-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await res.json();
  }

  async getSchoolTimeline(schoolId: string = 'SCH_ZP_SHIRUR'): Promise<SchoolEvidenceTimelineEntry[]> {
    const res = await fetch(`${API_BASE}/school-intelligence/${schoolId}/timeline`);
    return await res.json();
  }
}

// Phase 2 Type Definitions
export interface DiagnosticCheckTask {
  id: string;
  prompt: string;
  expected_response: string;
  instructions_for_teacher: string;
  prerequisite_skill: string;
}

export interface DiagnosticResponse {
  task_id: string;
  student_response: string;
  correct: boolean;
  teacher_observation?: string;
}

export interface DiagnosticCheck {
  id: string;
  hypothesis_id: string;
  prerequisite_skill: string;
  purpose: string;
  tasks: DiagnosticCheckTask[];
  status: 'pending' | 'completed';
  responses: DiagnosticResponse[];
  score_summary?: string;
}

export interface EvidencePattern {
  id: string;
  description: string;
  evidence_summary: string;
  supporting_task_ids: string[];
  successful_task_ids: string[];
  failed_task_ids: string[];
  teacher_observations: string[];
}

export interface Hypothesis {
  id: string;
  hypothesis_type: 'primary' | 'alternative';
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidence_rationale: string;
  status: 'open' | 'supported' | 'weakened' | 'unresolved';
  prerequisite_skill: string;
  supporting_evidence: string[];
  evidence_needed_to_confirm: string;
}

export interface NextLearningMove {
  id: string;
  description: string;
  rationale: string;
  prerequisite_focus: string;
  instructional_step: string;
}

export interface DiagnosticHistoryEntry {
  timestamp: string;
  event: string;
  previous_status: string;
  updated_status: string;
  evidence_added: string;
  interpretation: string;
}

export interface DiagnosticAnalysis {
  id: string;
  student_id: string;
  student_name: string;
  skill_id: string;
  skill_title: string;
  domain: 'reading' | 'numeracy';
  created_at: string;
  status: 'open' | 'supported' | 'weakened' | 'unresolved';
  observed_performance: string;
  observed_pattern: EvidencePattern;
  hypotheses: Hypothesis[];
  next_diagnostic_check: DiagnosticCheck;
  next_learning_move: NextLearningMove;
  diagnostic_history: DiagnosticHistoryEntry[];
  teacher_override_note?: string;
}

export interface ClassroomDiagnosticPattern {
  pattern_id: string;
  skill_id: string;
  skill_title: string;
  domain: 'reading' | 'numeracy';
  pattern_summary: string;
  student_count: number;
  students: { id: string; name: string; roll_number: string }[];
  potential_shared_prerequisite: string;
  recommended_diagnostic_focus: string;
}

export interface ClassroomDiagnosticOverview {
  class_id: string;
  class_name: string;
  grade: number;
  students_reviewed: number;
  students_requiring_review: number;
  patterns: ClassroomDiagnosticPattern[];
  summary_guidance: string;
}

// ============================================================
// PHASE 3 — CLASSROOM ORCHESTRATION TYPE DEFINITIONS
// ============================================================

export interface ClassroomActivity {
  start_activity: string;
  guided_activity: string;
  independent_activity: string;
  exit_activity: string;
  materials_needed: string[];
}

export interface PathMembership {
  student_id: string;
  student_name: string;
  current_focus: string;
  hypothesis_status: string;
  next_learning_move: string;
  evidence_basis: string;
  locked?: boolean;
}

export interface InstructionalPath {
  id: string;
  title: string;
  learning_focus: string;
  domain: 'numeracy' | 'reading' | 'general';
  teacher_attention: 'required' | 'recommended' | 'quick_check' | 'independent';
  duration_minutes: number;
  student_ids: string[];
  students: PathMembership[];
  rationale: string;
  next_learning_move: string;
  activity: ClassroomActivity;
  exit_task_ids: string[];
}

export interface LessonSegment {
  id: string;
  start_minute: number;
  end_minute: number;
  title: string;
  segment_type: 'whole_class' | 'teacher_focus' | 'quick_check' | 'peer_supported' | 'independent' | 'exit_evidence';
  active_path_id?: string;
  teacher_role: string;
  class_activity: string;
  students_involved_count: number;
}

export interface LessonEvidenceItem {
  student_id: string;
  student_name: string;
  path_id: string;
  task_id: string;
  result: 'demonstrated' | 'emerging' | 'not_yet' | 'not_observed';
  strategy_tags: string[];
  teacher_observation?: string;
  timestamp?: string;
}

export interface ClassroomPlan {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  lesson_topic: string;
  total_students: number;
  duration_minutes: number;
  available_resources: string[];
  status: 'draft' | 'ready' | 'active' | 'completed' | 'review';
  created_at: string;
  updated_at: string;
  paths: InstructionalPath[];
  timeline: LessonSegment[];
  teacher_attention_budget: {
    total_lesson_minutes: number;
    available_direct_minutes: number;
    allocated_direct_minutes: number;
    unallocated_buffer_minutes: number;
    whole_class_minutes: number;
    independent_monitoring_minutes: number;
  };
  evidence_records: LessonEvidenceItem[];
  teacher_notes?: string;
}

export interface ClassroomOrchestrationOverview {
  class_id: string;
  class_name: string;
  grade: number;
  lesson_topic: string;
  duration_minutes: number;
  total_students: number;
  patterns_summary: {
    path_id: string;
    focus: string;
    student_count: number;
    attention_level: string;
    sample_student: string;
    rationale: string;
  }[];
  attention_breakdown: {
    high: number;
    moderate: number;
    quick_check: number;
    independent: number;
  };
  existing_plan?: ClassroomPlan;
  available_resources: string[];
}

export interface OrchestrationBuildRequest {
  lesson_topic?: string;
  duration_minutes?: number;
  available_resources?: string[];
  custom_priorities?: Record<string, string>;
}

export interface LessonReviewData {
  plan_id: string;
  lesson_topic: string;
  duration_minutes: number;
  students_reached: string;
  evidence_collected_count: number;
  observations_logged_count: number;
  path_summaries: {
    path_id: string;
    title: string;
    student_count: number;
    demonstrated: number;
    emerging: number;
    requires_review: number;
  }[];
  new_learning_signals: {
    student_id: string;
    student_name: string;
    signal: string;
    recommended_action: string;
  }[];
  plan_status: string;
}

// Phase 4: Teach, Observe & Adapt Type Definitions
export interface InterventionEvidence {
  id: string;
  task_id: string;
  task_prompt: string;
  student_response: string;
  expected_response: string;
  correct: boolean;
  target_strategy_used?: boolean;
  source: 'post_check' | 'live_step' | 'multimodal';
  timestamp?: string;
}

export interface PostAssessment {
  id: string;
  correct_count: number;
  total_count: number;
  accuracy_percentage: number;
  items: InterventionEvidence[];
  completed_at: string;
}

export interface AdaptationDecision {
  id: string;
  response_status: 'SUPPORTED_PROGRESS' | 'CONTINUED_DIFFICULTY' | 'PARTIAL_RESPONSE' | 'INSUFFICIENT_EVIDENCE' | 'NEW_PATTERN';
  action_type: 'CONTINUE' | 'ADJUST' | 'INVESTIGATE';
  description: string;
  rationale: string;
  baseline_accuracy: number;
  post_accuracy: number;
  accuracy_change_points: number;
  observed_change_summary: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  teacher_decision: 'accepted' | 'modified' | 'rejected' | 'pending';
  teacher_notes?: string;
}

export interface TeacherObservationRecord {
  id: string;
  raw_text: string;
  structured_observation: {
    initial_assistance?: string;
    terminal_competence?: string;
    focal_strategy?: string;
    status_signal?: string;
    note?: string;
    [key: string]: any;
  };
  source: 'voice' | 'quick_note' | 'copilot';
  timestamp?: string;
}

export interface MultimodalEvidenceRecord {
  id: string;
  file_reference: string;
  evidence_type: string;
  task_id: string;
  visible_task: string;
  written_answer: string;
  regrouping_representation_visible: boolean;
  visible_steps?: string;
  extracted_observation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  teacher_verified: boolean;
  timestamp?: string;
}

export interface StudentTrajectoryEntry {
  timestamp: string;
  phase: string;
  title: string;
  metric_or_status: string;
  detail: string;
  evidence_trace_id?: string;
}

export interface StudentLearningTrajectory {
  student_id: string;
  student_name: string;
  skill_id: string;
  skill_title: string;
  baseline_evidence: string;
  diagnostic_hypothesis: string;
  instructional_path_title: string;
  intervention_evidence: string;
  current_response_status: string;
  next_learning_move: string;
  timeline: StudentTrajectoryEntry[];
}

export interface InterventionSession {
  id: string;
  class_id: string;
  path_id: string;
  path_title: string;
  student_id: string;
  student_name: string;
  skill_id: string;
  skill_title: string;
  started_at: string;
  completed_at?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'abandoned';
  current_step_index: number;
  baseline_correct: number;
  baseline_total: number;
  baseline_accuracy: number;
  post_assessment?: PostAssessment;
  adaptation_decision?: AdaptationDecision;
  observations: TeacherObservationRecord[];
  multimodal_records: MultimodalEvidenceRecord[];
}

export interface PathResponseBreakdown {
  path_id: string;
  title: string;
  total_students: number;
  progress_observed: number;
  partial_response: number;
  further_check: number;
  recommended_action: 'CONTINUE' | 'ADJUST' | 'INVESTIGATE';
  summary: string;
}

export interface ClassroomAdaptationSummary {
  class_id: string;
  lesson_topic: string;
  total_interventions: number;
  completed_count: number;
  evidence_collected_count: number;
  supported_progress_count: number;
  partial_response_count: number;
  further_check_count: number;
  insufficient_evidence_count: number;
  path_response_breakdowns: PathResponseBreakdown[];
  recommended_next_actions: {
    continue: number;
    adjust: number;
    investigate: number;
  };
}

export interface TeachAndAdaptOverview {
  class_id: string;
  class_name: string;
  lesson_topic: string;
  session_date: string;
  status: string;
  paths_status: {
    path_id: string;
    title: string;
    student_count: number;
    status: string;
  }[];
  active_interventions: InterventionSession[];
  adaptation_summary: ClassroomAdaptationSummary;
}

// Phase 5: School Intelligence & Early-Support Signals Type Definitions
export interface SchoolSignal {
  id: string;
  school_id: string;
  type: 'REPEATED_LEARNING_PATTERN' | 'PERSISTENT_DIFFICULTY' | 'EVIDENCE_COVERAGE_GAP' | 'POSITIVE_RESPONSE_PATTERN';
  title: string;
  focus_skill: string;
  affected_classes: string[];
  affected_students_count: number;
  evidence_coverage_percentage: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'open' | 'under_review' | 'action_assigned' | 'resolved';
  why_summary: string;
  suggested_action: string;
  first_observed: string;
  last_updated: string;
}

export interface SignalEvidence {
  id: string;
  signal_id: string;
  signal_title: string;
  signal_type: string;
  focus_skill: string;
  classes_breakdown: {
    class_id: string;
    class_name: string;
    student_count: number;
    status_distribution: {
      demonstrated: number;
      emerging: number;
      not_yet: number;
      not_assessed: number;
    };
    sample_students: string[];
  }[];
  overall_skill_status: {
    demonstrated: number;
    emerging: number;
    not_yet: number;
    not_assessed: number;
  };
  evidence_sources: Record<string, string>;
  deterministic_calculation: string;
  traceable_items: {
    source_id: string;
    type: string;
    detail: string;
  }[];
}

export interface SchoolReview {
  id: string;
  signal_id: string;
  signal_title: string;
  reviewer_id: string;
  action: 'reviewed' | 'acknowledged' | 'assigned_follow_up' | 'request_more_evidence';
  assigned_to?: string;
  review_question?: string;
  due_date?: string;
  notes?: string;
  status: 'open' | 'in_progress' | 'completed';
  created_at: string;
}

export interface InstructionalPattern {
  id: string;
  title: string;
  focus_domain: string;
  description: string;
  session_count: number;
  progress_count: number;
  partial_count: number;
  unresolved_count: number;
  sessions_detail: {
    session_id: string;
    student_name: string;
    class: string;
    outcome: string;
  }[];
}

export interface EvidenceBrief {
  id: string;
  school_id: string;
  school_name: string;
  reporting_period: string;
  evidence_coverage_summary: string;
  repeated_patterns_summary: string;
  intervention_response_summary: string;
  unresolved_areas_summary: string;
  evidence_gaps_summary: string;
  suggested_review: string;
  source_snapshot: Record<string, any>;
  created_at: string;
}

export interface SchoolEvidenceTimelineEntry {
  date: string;
  timestamp: string;
  event: string;
  phase: string;
  detail: string;
}

export interface SchoolIntelligenceOverview {
  school_id: string;
  school_name: string;
  academic_session: string;
  last_updated: string;
  total_students: number;
  assessed_students: number;
  coverage_percentage: number;
  active_paths_count: number;
  open_diagnostic_patterns_count: number;
  intervention_responses_count: number;
  signals: SchoolSignal[];
  classrooms_coverage: {
    class_id: string;
    class_name: string;
    teacher_name: string;
    total_students: number;
    assessed_count: number;
    coverage_percentage: number;
    open_patterns_count: number;
    interventions_count: number;
    post_evidence_count: number;
    status: string;
  }[];
  skills_landscape: {
    literacy: {
      skill_id: string;
      skill_title: string;
      demonstrated: number;
      emerging: number;
      not_yet: number;
      not_assessed: number;
    }[];
    numeracy: {
      skill_id: string;
      skill_title: string;
      demonstrated: number;
      emerging: number;
      not_yet: number;
      not_assessed: number;
    }[];
  };
  evidence_trends: {
    period: string;
    coverage_pct: number;
    assessed: number;
    interventions_active: number;
  }[];
  intervention_landscape: {
    total_interventions_recorded: number;
    progress_observed: number;
    partial_response: number;
    continued_difficulty: number;
    insufficient_evidence: number;
    focal_distributions: {
      focus: string;
      count: number;
      progress_rate: number;
    }[];
  };
  positive_patterns: InstructionalPattern[];
  timeline: SchoolEvidenceTimelineEntry[];
}

export const api = new ApiService();

