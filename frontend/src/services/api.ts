import { localDb, LocalResponse, LocalObservation } from './db';

const API_BASE = '/api';

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

export const api = new ApiService();

