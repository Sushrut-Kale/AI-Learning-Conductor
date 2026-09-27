import Dexie, { Table } from 'dexie';

export interface LocalClass {
  id: string;
  name: string;
  grade: number;
  language: string;
  academic_year: string;
  student_count: number;
  completed_count: number;
  in_progress_count: number;
  not_assessed_count: number;
}

export interface LocalStudent {
  id: string;
  roll_number: string;
  name: string;
  grade: number;
  language: string;
  class_id: string;
  assessment_status: 'completed' | 'in_progress' | 'not_assessed';
  avatar_color: string;
}

export interface LocalResponse {
  id: string;
  student_id: string;
  assessment_id: string;
  question_id: string;
  skill_id: string;
  domain: 'reading' | 'numeracy';
  expected_response: string;
  student_response: string;
  correct: boolean;
  teacher_observation?: string;
  timestamp: string;
  synced: boolean;
}

export interface LocalObservation {
  id: string;
  student_id: string;
  question_id?: string;
  raw_text: string;
  observation_type: string;
  source: 'teacher' | 'voice';
  timestamp: string;
  synced: boolean;
}

export interface LocalFingerprint {
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
  evidence_breakdown: any[];
  teacher_observations_summary: string[];
  structured_observations: any[];
  ai_summary_narrative: string;
  teacher_verified: boolean;
  teacher_notes?: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  type: 'response' | 'observation' | 'fingerprint_override';
  payload: any;
  created_at: string;
}

export class AppDatabase extends Dexie {
  classes!: Table<LocalClass, string>;
  students!: Table<LocalStudent, string>;
  responses!: Table<LocalResponse, string>;
  observations!: Table<LocalObservation, string>;
  fingerprints!: Table<LocalFingerprint, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('AILearningConductorDB');
    this.version(1).stores({
      classes: 'id',
      students: 'id, class_id, assessment_status',
      responses: 'id, student_id, question_id, skill_id, synced',
      observations: 'id, student_id, synced',
      fingerprints: 'id, student_id, synced',
      syncQueue: '++id, type, created_at'
    });
  }
}

export const localDb = new AppDatabase();
