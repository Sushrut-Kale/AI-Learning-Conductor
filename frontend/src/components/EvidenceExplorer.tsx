import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  ShieldCheck, 
  FileText, 
  Clock, 
  MessageSquare,
  Search,
  BookOpen,
  Calculator
} from 'lucide-react';
import { api } from '../services/api';

interface EvidenceExplorerProps {
  studentId: string;
  initialSkillId?: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const EvidenceExplorer: React.FC<EvidenceExplorerProps> = ({ 
  studentId, 
  initialSkillId, 
  onNavigate 
}) => {
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>(initialSkillId || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, [studentId]);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.getEvidence(studentId);
      setEvidenceData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !evidenceData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Auditing assessment evidence...</p>
        </div>
      </div>
    );
  }

  const { student, raw_responses = [], evidence_breakdown = [] } = evidenceData;

  const filteredResponses = raw_responses.filter((r: any) => {
    if (selectedSkillFilter === 'all') return true;
    return r.skill_id === selectedSkillFilter;
  });

  const totalAttempted = raw_responses.length;
  const correctCount = raw_responses.filter((r: any) => r.correct).length;
  const accuracyPct = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Header */}
      <div>
        <button
          onClick={() => onNavigate('fingerprint', { studentId })}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Learning Fingerprint
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Evidence Explorer ('Why?')
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Strict Explainability
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Trace every Learning Fingerprint statement back to raw stimuli, child responses, and teacher notes.
        </p>
      </div>

      {/* Grounding Principles Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold mb-0.5">Section 12: Evidence-First Explainability Principle</p>
          <p>
            No pedagogical claim is made without verifiable task-level audit records. When the system states 
            “Paragraph reading is emerging”, this dashboard proves the exact items completed and missed.
          </p>
        </div>
      </div>

      {/* Student Meta & Audit Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Student Card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
            {student?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">{student?.name}</h2>
            <p className="text-[11px] text-slate-500">
              Grade {student?.grade} • {student?.language} • #{student?.id}
            </p>
          </div>
        </div>

        {/* Audit Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Tasks Recorded</p>
          <p className="text-xl font-bold text-slate-800">{totalAttempted}</p>
          <p className="text-[10px] text-slate-500">Audit Items</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Demonstrated Accuracy</p>
          <p className="text-xl font-bold text-emerald-700">{accuracyPct}%</p>
          <p className="text-[10px] text-emerald-600">{correctCount} of {totalAttempted} Correct</p>
        </div>

      </div>

      {/* Filter by Skill */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Foundational Skill:</span>
        </div>

        <select
          value={selectedSkillFilter}
          onChange={e => setSelectedSkillFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Skills ({raw_responses.length} Tasks)</option>
          {evidence_breakdown.map((s: any) => (
            <option key={s.skill_id} value={s.skill_id}>
              {s.skill_title} ({s.correct}/{s.total} correct - {s.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Evidence Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Domain & Skill</th>
                <th className="py-3 px-4">Stimulus Presented</th>
                <th className="py-3 px-4">Expected Target</th>
                <th className="py-3 px-4">Student Response</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Teacher Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No task records match this filter.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((r: any) => (
                  <tr key={r.id || r.question_id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {r.question_id}
                    </td>

                    {/* Skill */}
                    <td className="py-3 px-4">
                      <span className="capitalize font-semibold text-slate-800">
                        {r.skill_id.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400 capitalize">{r.domain}</p>
                    </td>

                    {/* Stimulus */}
                    <td className="py-3 px-4 max-w-xs font-medium text-slate-900 truncate">
                      {r.expected_response && r.expected_response.length < 20 ? r.expected_response : `Task Item ${r.question_id}`}
                    </td>

                    {/* Expected */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {r.expected_response}
                    </td>

                    {/* Student Response */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900 font-semibold">
                      {r.student_response}
                    </td>

                    {/* Result */}
                    <td className="py-3 px-4">
                      {r.correct ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </td>

                    {/* Teacher Observation */}
                    <td className="py-3 px-4 text-slate-600 italic text-[11px] max-w-xs">
                      {r.teacher_observation ? (
                        <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>“{r.teacher_observation}”</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
