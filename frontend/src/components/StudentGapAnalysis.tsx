import React, { useState, useEffect } from 'react';
import { api, DiagnosticAnalysis, DiagnosticResponse } from '../services/api';
import { PageHeader, SectionHeader, ActionButton } from './common/InstitutionalUI';
import { LearningGapGraph } from './LearningGapGraph';
import { DiagnosticCheckModal } from './DiagnosticCheckModal';

interface StudentGapAnalysisProps {
  studentId: string;
  skillId?: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const StudentGapAnalysis: React.FC<StudentGapAnalysisProps> = ({
  studentId,
  skillId,
  onNavigate
}) => {
  const [analysis, setAnalysis] = useState<DiagnosticAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'report' | 'graph'>('report');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [teacherNote, setTeacherNote] = useState('');
  const [isUpdatingOverride, setIsUpdatingOverride] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [studentId, skillId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentDiagnostics(studentId, skillId);
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnosticCheck = async (responses: DiagnosticResponse[]) => {
    try {
      const res = await api.submitDiagnosticCheck(studentId, {
        skill_id: analysis?.skill_id,
        responses
      });
      if (res.analysis) {
        setAnalysis(res.analysis);
      }
    } catch (e) {
      alert('Failed to record diagnostic check responses.');
    }
  };

  const handleTeacherOverride = async (action: 'accept' | 'reject' | 'needs_more_evidence') => {
    setIsUpdatingOverride(true);
    try {
      const res = await api.overrideDiagnosticHypothesis(studentId, {
        skill_id: analysis?.skill_id,
        action,
        teacher_note: teacherNote || `Teacher marked hypothesis as ${action}.`
      });
      if (res.analysis) {
        setAnalysis(res.analysis);
      }
      setTeacherNote('');
    } catch (e) {
      alert('Error updating teacher override.');
    } finally {
      setIsUpdatingOverride(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Synthesizing Learning Gap Analysis from evidence...
      </div>
    );
  }

  const primaryHyp = analysis.hypotheses.find(h => h.hypothesis_type === 'primary') || analysis.hypotheses[0];
  const altHyp = analysis.hypotheses.find(h => h.hypothesis_type === 'alternative');

  const getStatusBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'supported') return 'bg-[#EDF3EE] text-[#3B5E43] border-[#C6D8CA]';
    if (s === 'weakened') return 'bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1]';
    if (s === 'unresolved') return 'bg-[#FAF4EB] text-[#8F6627] border-[#E5D8C1]';
    return 'bg-[#EFECE5] text-[#17365D] border-[#D5CFC3]';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        breadcrumb="Diagnostic Overview"
        onBreadcrumbClick={() => onNavigate('diagnostic_overview', { classId: 'CLS_G3A' })}
        title={`Learning Gap Analysis: ${analysis.student_name}`}
        subtitle={`Observed Skill: ${analysis.skill_title} • Domain: ${analysis.domain.toUpperCase()} • Student Code: ${analysis.student_id}`}
        badge={`Hypothesis: ${analysis.status.toUpperCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('fingerprint', { studentId })}
            >
              View Learning Fingerprint
            </ActionButton>
            <ActionButton 
              variant="maroon"
              onClick={() => setShowCheckModal(true)}
            >
              {analysis.next_diagnostic_check.status === 'completed' ? 'Re-Run Diagnostic Check' : 'Run Diagnostic Check →'}
            </ActionButton>
          </div>
        }
      />

      {/* View Switcher: Textual Report (Screen 8) vs Learning Gap Graph (Screen 9) */}
      <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1 font-semibold border rounded-[4px] transition-colors ${
              activeTab === 'report'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#525252] border-[#D9D3C7] hover:bg-[#F1EEE7]'
            }`}
          >
            Structured Diagnostic Report (Screen 8)
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1 font-semibold border rounded-[4px] transition-colors ${
              activeTab === 'graph'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#525252] border-[#D9D3C7] hover:bg-[#F1EEE7]'
            }`}
          >
            Learning Gap Graph (Screen 9)
          </button>
        </div>

        <span className="text-[11px] text-[#737373]">
          Status: <b className="uppercase text-[#252525]">{analysis.status}</b>
        </span>
      </div>

      {activeTab === 'graph' ? (
        /* SCREEN 9: INTERACTIVE LEARNING GAP GRAPH */
        <LearningGapGraph 
          analysis={analysis} 
          onNavigate={onNavigate}
          onRunCheck={() => setShowCheckModal(true)}
        />
      ) : (
        /* SCREEN 8: STRUCTURED DIAGNOSTIC REPORT */
        <div className="space-y-5 text-xs">
          
          {/* Section 1: Observed Performance & Pattern (OBSERVED FACT - Navy) */}
          <div className="bg-[#FCFBF8] border border-[#17365D] rounded-[4px] p-5 space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#17365D]">
                [Observed Fact] Task Performance & Pattern Extraction
              </span>
              <span className="font-mono text-[#17365D] font-semibold text-xs">
                Performance: {analysis.observed_performance}
              </span>
            </div>

            <div>
              <p className="font-serif font-bold text-base text-[#252525]">
                Observed Pattern: {analysis.observed_pattern.description}
              </p>
              <p className="text-[#525252] mt-1 leading-relaxed">
                Evidence Summary: {analysis.observed_pattern.evidence_summary}
              </p>
            </div>

            {analysis.observed_pattern.teacher_observations.length > 0 && (
              <div className="p-2.5 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[3px] text-[#525252]">
                <span className="font-semibold text-[#252525]">Teacher Notes Preserved: </span>
                {analysis.observed_pattern.teacher_observations.join('; ')}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('evidence', { studentId, skillId: analysis.skill_id })}
              >
                Inspect Task-Level Evidence Trace ('Why?') →
              </ActionButton>
            </div>
          </div>

          {/* Section 2: Possible Prerequisite Gap & Hypotheses (AI HYPOTHESIS - Maroon Dashed) */}
          <div className="bg-[#FCFBF8] border-2 border-dashed border-[#8A2F35] rounded-[4px] p-5 space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A2F35]">
                  [AI Hypothesis] Prerequisite Gap Reasoning
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.2 border rounded-xs ${getStatusBadgeColor(primaryHyp.status)}`}>
                  {primaryHyp.status}
                </span>
              </div>
              <span className="text-[#666666] text-[11px]">
                Confidence: <b className="text-[#8A2F35]">{primaryHyp.confidence}</b>
              </span>
            </div>

            <div>
              <p className="font-serif font-bold text-base text-[#252525]">
                Primary Hypothesis: {primaryHyp.description}
              </p>
              <p className="text-[#525252] mt-1 leading-relaxed">
                Prerequisite Skill: <b className="text-[#17365D]">{primaryHyp.prerequisite_skill}</b>. {primaryHyp.confidence_rationale}
              </p>
            </div>

            <div className="bg-[#FAF4EB] border border-[#E5D8C1] rounded-[3px] p-3 text-[#8F6627] text-xs">
              <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">
                Evidence Required to Confirm / Disconfirm:
              </span>
              {primaryHyp.evidence_needed_to_confirm}
            </div>

            {/* Alternative Explanation (Section 8: Multi-Hypothesis Reasoning) */}
            {altHyp && (
              <div className="pt-2 border-t border-[#EFECE5] text-[#525252]">
                <span className="font-semibold text-[#8A2F35] text-[11px] uppercase tracking-wide block mb-0.5">
                  Alternative Explanation Considered:
                </span>
                <p>{altHyp.description} (Confidence: {altHyp.confidence})</p>
              </div>
            )}
          </div>

          {/* Section 3: Next Diagnostic Check (DIAGNOSTIC CHECK - Ochre) */}
          <div className="bg-[#FAF4EB] border border-[#A87932] rounded-[4px] p-5 space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E5D8C1] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F6627]">
                [Targeted Diagnostic Check] Prerequisite Verification
              </span>
              <span className="font-semibold text-[#8F6627] text-xs">
                {analysis.next_diagnostic_check.status === 'completed' 
                  ? `Completed (${analysis.next_diagnostic_check.score_summary})` 
                  : 'Pending Teacher Administration'}
              </span>
            </div>

            <div>
              <p className="font-serif font-bold text-base text-[#252525]">
                Diagnostic Purpose: {analysis.next_diagnostic_check.purpose}
              </p>
              <p className="text-[#525252] mt-1">
                Instrument: 3 targeted diagnostic tasks isolating {analysis.next_diagnostic_check.prerequisite_skill}.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-[#666666] italic">
                {analysis.next_diagnostic_check.status === 'completed'
                  ? 'New evidence ingested into diagnostic loop. Review updated interpretation below.'
                  : 'Administering targeted check will update hypothesis status to SUPPORTED or WEAKENED.'}
              </span>
              <ActionButton 
                variant="maroon" 
                size="sm" 
                onClick={() => setShowCheckModal(true)}
              >
                {analysis.next_diagnostic_check.status === 'completed' ? 'Re-Run Diagnostic Check' : 'Run Diagnostic Check (3 Tasks) →'}
              </ActionButton>
            </div>
          </div>

          {/* Section 4: Next Learning Move (NEXT LEARNING MOVE - Muted Green) */}
          <div className="bg-[#EDF3EE] border-2 border-[#4F7658] rounded-[4px] p-5 space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#C6D8CA] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B5E43]">
                [Instructional Action] The Next Learning Move
              </span>
              <span className="text-[10px] font-semibold uppercase text-[#3B5E43] bg-[#FCFBF8] px-2 py-0.5 border border-[#C6D8CA] rounded-xs">
                Smallest Meaningful Step
              </span>
            </div>

            <div>
              <p className="font-serif font-bold text-base text-[#17365D]">
                {analysis.next_learning_move.instructional_step}
              </p>
              <p className="text-xs text-[#252525] mt-1 leading-relaxed">
                {analysis.next_learning_move.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#C6D8CA] text-[11px] text-[#3B5E43] font-sans">
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Rationale:</span>
              {analysis.next_learning_move.rationale}
            </div>
          </div>

          {/* Section 5: The Diagnostic Loop & Hypothesis Evolution Log (Section 16, 34, 35) */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3">
            <SectionHeader 
              label="Evidence-Based Reasoning Audit"
              title="Hypothesis Evolution & Diagnostic History" 
              rightElement={
                <span className="text-[10px] text-[#666666]">
                  Demonstrates AI Updating Its Mind
                </span>
              }
            />

            <div className="divide-y divide-[#EFECE5] text-xs">
              {analysis.diagnostic_history.map((entry, idx) => (
                <div key={idx} className="py-2.5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-[#17365D]">
                      {entry.event} — Status: <span className="font-mono text-[#8A2F35]">{entry.previous_status} → {entry.updated_status}</span>
                    </span>
                    <span className="text-[10px] text-[#737373] font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-[#525252]">
                    <span className="font-semibold text-[#252525]">Evidence Ingested: </span>
                    {entry.evidence_added}
                  </p>
                  <p className="text-[#525252] italic bg-[#F1EEE7] p-2 rounded-[3px] text-[11px]">
                    Interpretation: {entry.interpretation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Teacher Control Panel (Section 36) */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3">
            <SectionHeader 
              label="Teacher In The Loop (Section 36)"
              title="Teacher Decision & Hypothesis Verification" 
            />
            <p className="text-xs text-[#666666]">
              As the classroom instructional authority, review or override the AI hypothesis:
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ActionButton 
                variant="secondary" 
                size="sm" 
                onClick={() => handleTeacherOverride('accept')}
                disabled={isUpdatingOverride}
              >
                ✓ Accept Hypothesis
              </ActionButton>
              <ActionButton 
                variant="danger" 
                size="sm" 
                onClick={() => handleTeacherOverride('reject')}
                disabled={isUpdatingOverride}
              >
                ✕ Reject Hypothesis
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                size="sm" 
                onClick={() => handleTeacherOverride('needs_more_evidence')}
                disabled={isUpdatingOverride}
              >
                Mark "Needs More Evidence"
              </ActionButton>
            </div>

            <div className="pt-2">
              <input
                type="text"
                placeholder="Optional teacher annotation (e.g., student demonstrated mastery during whiteboard warm-up)..."
                value={teacherNote}
                onChange={e => setTeacherNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] focus:outline-none focus:border-[#17365D]"
              />
            </div>
          </div>

        </div>
      )}

      {/* Diagnostic Check Runner Modal */}
      {showCheckModal && (
        <DiagnosticCheckModal
          studentId={analysis.student_id}
          studentName={analysis.student_name}
          check={analysis.next_diagnostic_check}
          onClose={() => setShowCheckModal(false)}
          onComplete={handleRunDiagnosticCheck}
        />
      )}

    </div>
  );
};
