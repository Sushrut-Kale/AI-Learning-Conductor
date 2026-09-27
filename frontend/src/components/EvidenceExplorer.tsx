import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  PageHeader, 
  ActionButton 
} from './common/InstitutionalUI';

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
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Compiling task-level evidence audit records...
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumb="Learning Fingerprint"
        onBreadcrumbClick={() => onNavigate('fingerprint', { studentId })}
        title="Evidence Record"
        subtitle={`Student: ${student?.name} (${student?.id}) • Grade ${student?.grade} • Total Logged Tasks: ${totalAttempted}`}
        badge="Audit Trail"
        actions={
          <ActionButton 
            variant="secondary"
            onClick={() => onNavigate('fingerprint', { studentId })}
          >
            ← Return to Fingerprint
          </ActionButton>
        }
      />

      {/* Explanatory Policy Callout (Section 15) */}
      <div className="bg-[#F1EEE7] border-l-4 border-l-[#17365D] border border-[#D9D3C7] rounded-[4px] p-4 text-xs text-[#525252] leading-relaxed">
        <p className="font-bold text-[#17365D] uppercase tracking-wide text-[10px] mb-1">
          Data Provenance & Audit Protocol
        </p>
        <p>
          Every classification statement in the Learning Fingerprint is strictly verifiable against the individual task records below. 
          No probabilistic inference or pedagogical extrapolation is permitted without direct task evidence.
        </p>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#666666] font-semibold">Total Tasks Logged</p>
          <p className="font-serif font-bold text-xl text-[#17365D] mt-0.5">{totalAttempted}</p>
        </div>
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#666666] font-semibold">Demonstrated Correct</p>
          <p className="font-serif font-bold text-xl text-[#3B5E43] mt-0.5">{correctCount}</p>
        </div>
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#666666] font-semibold">Demonstrated Rate</p>
          <p className="font-serif font-bold text-xl text-[#17365D] mt-0.5">{accuracyPct}%</p>
        </div>
      </div>

      {/* Skill Filter Dropdown */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 flex flex-col sm:flex-row items-baseline justify-between gap-3 text-xs">
        <label className="font-semibold text-[#252525]">
          Filter Evidence by Foundational Skill:
        </label>
        <select
          value={selectedSkillFilter}
          onChange={e => setSelectedSkillFilter(e.target.value)}
          className="px-3 py-1.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] text-[#252525] focus:outline-none focus:border-[#17365D]"
        >
          <option value="all">All Evaluated Skills ({raw_responses.length} Tasks)</option>
          {evidence_breakdown.map((s: any) => (
            <option key={s.skill_id} value={s.skill_id}>
              {s.skill_title} ({s.correct}/{s.total} tasks correct — {s.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Chronological Audit Table (Section 15) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="institutional-table">
            <thead>
              <tr>
                <th className="py-2.5 px-3 text-left w-28">Task Code</th>
                <th className="py-2.5 px-3 text-left">Domain & Skill</th>
                <th className="py-2.5 px-3 text-left">Stimulus Presented</th>
                <th className="py-2.5 px-3 text-left">Expected Target</th>
                <th className="py-2.5 px-3 text-left">Recorded Response</th>
                <th className="py-2.5 px-3 text-center w-16">Result</th>
                <th className="py-2.5 px-3 text-left w-52">Teacher Observation</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#737373]">
                    No task records registered for this specific skill.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((r: any) => (
                  <tr key={r.id || r.question_id} className="hover:bg-[#F1EEE7] transition-colors">
                    
                    {/* Task ID */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#525252]">
                      {r.question_id}
                    </td>

                    {/* Skill */}
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-[#17365D]">
                        {r.skill_id.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#737373] uppercase ml-1.5 font-semibold">
                        [{r.domain}]
                      </span>
                    </td>

                    {/* Stimulus */}
                    <td className="py-2.5 px-3 text-[#252525] font-serif font-medium">
                      {r.expected_response && r.expected_response.length < 25 ? r.expected_response : `Task Item ${r.question_id}`}
                    </td>

                    {/* Expected */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#666666]">
                      {r.expected_response}
                    </td>

                    {/* Student Response */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#252525] font-semibold">
                      {r.student_response}
                    </td>

                    {/* Result */}
                    <td className="py-2.5 px-3 text-center">
                      {r.correct ? (
                        <span className="text-[#3B5E43] font-bold text-xs bg-[#EDF3EE] px-1.5 py-0.5 rounded-xs border border-[#C6D8CA]">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[#873F3F] font-bold text-xs bg-[#F9EDED] px-1.5 py-0.5 rounded-xs border border-[#DFC1C1]">
                          ✕
                        </span>
                      )}
                    </td>

                    {/* Teacher Observation */}
                    <td className="py-2.5 px-3 text-[11px] text-[#525252]">
                      {r.teacher_observation ? (
                        <span className="italic">“{r.teacher_observation}”</span>
                      ) : (
                        <span className="text-[#B8B0A2]">—</span>
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
