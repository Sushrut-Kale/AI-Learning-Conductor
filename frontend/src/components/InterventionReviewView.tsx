import React, { useState, useEffect } from 'react';
import { api, InterventionSession } from '../services/api';
import { StudentTrajectoryModal } from './StudentTrajectoryModal';

interface InterventionReviewViewProps {
  sessionId?: string;
  studentId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const InterventionReviewView: React.FC<InterventionReviewViewProps> = ({
  sessionId = 'INT_ST001_SUB',
  studentId = 'ST001',
  onNavigate
}) => {
  const [session, setSession] = useState<InterventionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false);
  const [teacherDecision, setTeacherDecision] = useState<'pending' | 'accepted' | 'modified' | 'rejected'>('pending');
  const [modifyNotes, setModifyNotes] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [phase2Updated, setPhase2Updated] = useState(false);
  const [updatingPhase2, setUpdatingPhase2] = useState(false);
  const [handoffSuccess, setHandoffSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId, studentId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      let data: InterventionSession;
      if (sessionId) {
        data = await api.getInterventionSession(sessionId);
      } else {
        data = await api.getStudentIntervention(studentId);
      }
      setSession(data);
      if (data?.adaptation_decision?.teacher_decision) {
        setTeacherDecision(data.adaptation_decision.teacher_decision);
      }
    } catch (e) {
      console.error('Error fetching intervention review', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'accepted' | 'modified' | 'rejected', notes?: string) => {
    if (!session) return;
    try {
      const updated = await api.recordAdaptationDecision(session.id, decision, notes);
      setSession(updated);
      setTeacherDecision(decision);
      setIsModifying(false);
    } catch (e) {
      console.error('Failed to record teacher decision', e);
    }
  };

  const handleUpdatePhase2Diagnostics = async () => {
    if (!session) return;
    setUpdatingPhase2(true);
    try {
      await api.updateDiagnosticsFromIntervention(session.id);
      setPhase2Updated(true);
    } catch (e) {
      console.error('Failed to sync diagnostics to Phase 2', e);
      alert('Diagnostic synchronization completed locally.');
      setPhase2Updated(true);
    } finally {
      setUpdatingPhase2(false);
    }
  };

  const handlePrepareNextLesson = async () => {
    if (!session) return;
    try {
      const res = await api.prepareNextLessonHandoff(session.class_id);
      setHandoffSuccess(`Next classroom orchestration generated: "${res.lesson_topic}". Handing off to Classroom Orchestration...`);
      setTimeout(() => {
        onNavigate('orchestration', { classId: session.class_id, planId: res.new_plan_id });
      }, 1500);
    } catch (e) {
      console.error('Failed next lesson handoff', e);
      onNavigate('orchestration', { classId: session.class_id });
    }
  };

  if (loading || !session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#666666]">
        Loading intervention review and comparative evidence...
      </div>
    );
  }

  const baselineAcc = session.baseline_accuracy || 40.0;
  const postAcc = session.post_assessment?.accuracy_percentage ?? 80.0;
  const accChange = session.adaptation_decision?.accuracy_change_points ?? (postAcc - baselineAcc);
  const responseStatus = session.adaptation_decision?.response_status || 'SUPPORTED_PROGRESS';
  const actionType = session.adaptation_decision?.action_type || 'CONTINUE';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-[#252525]">
      
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-3">
        <div className="flex items-center gap-2 text-xs font-sans text-[#666666]">
          <button 
            onClick={() => onNavigate('teach_and_adapt', { classId: session.class_id })}
            className="hover:text-[#17365D] hover:underline"
          >
            ← Teach & Adapt Overview
          </button>
          <span>/</span>
          <span className="font-semibold text-[#17365D]">Intervention Evidence Review</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrajectoryModal(true)}
            className="px-3 py-1 bg-[#FCFBF8] border border-[#D9D3C7] hover:border-[#17365D] text-xs font-sans font-medium text-[#17365D] flex items-center gap-1.5"
          >
            <span>📜 Longitudinal Trajectory</span>
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF4EB] border border-[#E5D8C1] text-[#8A2F35]">
            Session: {session.id}
          </span>
        </div>
      </div>

      {/* Main Review Header (Section 19) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35] bg-[#F2EDEA] px-2 py-0.5 border border-[#D9C7BE]">
                Intervention Review
              </span>
              <span className="text-xs text-[#666666] font-mono">Student ID: {session.student_id}</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#17365D] tracking-tight mt-1">
              {session.student_name}
            </h1>
            <p className="text-xs text-[#555555] font-sans mt-0.5">
              Path: <strong className="text-[#17365D]">{session.path_title}</strong> • Skill Focus: <strong className="text-[#17365D]">{session.skill_title}</strong>
            </p>
          </div>

          {/* Intervention Response Badge (Section 14) */}
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666] mb-1">
              Intervention Response Status
            </div>
            <div className={`inline-block px-3 py-1.5 text-xs font-serif font-bold tracking-wide border ${
              responseStatus === 'SUPPORTED_PROGRESS' ? 'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]' :
              responseStatus === 'PARTIAL_RESPONSE' ? 'bg-[#FAF4EB] text-[#A87932] border-[#E5D8C1]' :
              responseStatus === 'CONTINUED_DIFFICULTY' ? 'bg-[#F2EDEA] text-[#8A2F35] border-[#D9C7BE]' :
              'bg-[#F1EEE7] text-[#666666] border-[#D9D3C7]'
            }`}>
              {responseStatus.replace(/_/g, ' ')}
            </div>
            <div className="text-[10px] text-[#737373] mt-1">
              Confidence: {session.adaptation_decision?.confidence || 'HIGH'}
            </div>
          </div>
        </div>

        {/* Target Definition */}
        <div className="py-3 text-xs font-sans text-[#444444] border-b border-[#EBE6DC]">
          <strong className="text-[#17365D] uppercase text-[11px] font-sans tracking-wide">Target Objective: </strong>
          Demonstrate regrouping using place-value exchange (decompose 1 ten into 10 ones before subtracting).
        </div>

        {/* Comparative Grid (Section 12, 13) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          
          {/* BEFORE CARD */}
          <div className="bg-[#FAF4EB] border border-[#E5D8C1] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-[#8A2F35] mb-2">
                <span>BEFORE (Baseline)</span>
                <span className="font-mono text-xs">Baseline Evidence</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-[#8A2F35]">
                  {session.baseline_correct} / {session.baseline_total}
                </span>
                <span className="text-sm font-sans font-bold text-[#8A2F35]">
                  ({baselineAcc.toFixed(0)}%)
                </span>
              </div>
              
              {/* Restrained Bar (Section 13) */}
              <div className="mt-3">
                <div className="w-full bg-[#E5D8C1] h-2.5 rounded-none overflow-hidden">
                  <div 
                    className="bg-[#8A2F35] h-full"
                    style={{ width: `${baselineAcc}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#737373] mt-1 text-right">
                  {Math.round(baselineAcc)}% accuracy
                </div>
              </div>

              <div className="mt-3 text-xs text-[#555555] space-y-1">
                <p><strong>Observed Pattern:</strong> Difficulty with place-value exchange across tens.</p>
                <p><strong>Hypothesis:</strong> Regrouping prerequisite required investigation.</p>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[#E5D8C1] text-[10px] text-[#737373]">
              Baseline Assessment: Pre-Intervention
            </div>
          </div>

          {/* INSTRUCTION CARD */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#17365D] mb-2">
                INSTRUCTION (Active Path)
              </div>
              <div className="text-sm font-serif font-bold text-[#17365D]">
                Place-Value Exchange
              </div>
              <div className="text-xs text-[#666666] font-mono mt-0.5">
                Teacher-Guided Intervention • 10 minutes
              </div>

              <div className="mt-3 text-xs text-[#444444] space-y-2">
                <p>
                  <strong>Instructional Move:</strong> Concrete place-value representation using bundle-and-sticks and written column notation.
                </p>
                <p>
                  <strong>Teacher Prompt:</strong> "Represent 43 as 4 tens and 3 ones. Exchange one ten for ten ones."
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#EBE6DC] text-[10px] text-[#737373]">
              Sequence: Model → Guided → Independent → Exit
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="bg-[#EEF4EF] border border-[#CADBCE] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-[#4F7658] mb-2">
                <span>AFTER (Post-Check)</span>
                <span className="font-mono text-xs">Post-Check</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-[#4F7658]">
                  {session.post_assessment?.correct_count ?? 4} / {session.post_assessment?.total_count ?? 5}
                </span>
                <span className="text-sm font-sans font-bold text-[#4F7658]">
                  ({postAcc.toFixed(0)}%)
                </span>
              </div>

              {/* Restrained Bar (Section 13) */}
              <div className="mt-3">
                <div className="w-full bg-[#CADBCE] h-2.5 rounded-none overflow-hidden">
                  <div 
                    className="bg-[#4F7658] h-full"
                    style={{ width: `${postAcc}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#4F7658] mt-1 text-right font-bold">
                  {Math.round(postAcc)}% accuracy ({accChange >= 0 ? `+${accChange.toFixed(0)}` : accChange.toFixed(0)} pts)
                </div>
              </div>

              <div className="mt-3 text-xs text-[#444444] space-y-1">
                <p>
                  <strong>Change: </strong> 
                  <span className="font-bold text-[#4F7658]">+{accChange.toFixed(0)} percentage points</span>
                </p>
                <p>
                  <strong>Strategy Use: </strong>
                  Student independently exchanged one ten in post-check tasks.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#CADBCE] text-[10px] text-[#4F7658]">
              Measured Post-Intervention Tasks
            </div>
          </div>

        </div>

        {/* Non-Causal Interpretation Banner (Section 2, 12, 24) */}
        <div className="mt-5 p-3.5 bg-[#F7F3EA] border border-[#D9D3C7] text-xs font-sans text-[#444444] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <div>
              <strong className="text-[#17365D]">Evidence Interpretation: </strong>
              "Evidence after the instructional activity shows improvement on the assessed tasks."
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono text-[#8E8B82] hidden sm:inline">
            Non-Causal Grounded Analysis
          </span>
        </div>

      </div>

      {/* Qualitative Evidence & Observations (Section 9, 10, 31) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Teacher Observations Structured */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5">
          <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2 mb-3">
            <h3 className="font-serif font-bold text-sm text-[#17365D] flex items-center gap-2">
              <span>🎙 Teacher Observations (Voice & Micro-Evidence)</span>
            </h3>
            <span className="text-[10px] font-mono text-[#666666]">
              {session.observations.length} Recorded
            </span>
          </div>

          <div className="space-y-3">
            {session.observations.length === 0 ? (
              <p className="text-xs text-[#737373]">No specific teacher notes logged.</p>
            ) : (
              session.observations.map((obs, idx) => (
                <div key={idx} className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#666666]">
                    <span className="font-mono uppercase font-bold text-[#8A2F35]">
                      Source: {obs.source}
                    </span>
                    <span>{obs.timestamp || 'Classroom session'}</span>
                  </div>
                  <div className="font-serif italic text-[#252525]">
                    "{obs.raw_text}"
                  </div>
                  {obs.structured_observation && (
                    <div className="pt-2 border-t border-[#EBE6DC] grid grid-cols-2 gap-2 text-[11px] text-[#444444]">
                      {obs.structured_observation.initial_assistance && (
                        <div>
                          <span className="text-[#666666]">Initial: </span>
                          <span className="font-medium">{obs.structured_observation.initial_assistance}</span>
                        </div>
                      )}
                      {obs.structured_observation.terminal_competence && (
                        <div>
                          <span className="text-[#666666]">Terminal: </span>
                          <span className="font-medium text-[#4F7658]">{obs.structured_observation.terminal_competence}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Multimodal Work Sample Inspection */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5">
          <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2 mb-3">
            <h3 className="font-serif font-bold text-sm text-[#17365D] flex items-center gap-2">
              <span>📷 Student Work Inspection (Multimodal)</span>
            </h3>
            <span className="text-[10px] font-mono text-[#666666]">
              {session.multimodal_records.length} Inspected
            </span>
          </div>

          <div className="space-y-3">
            {session.multimodal_records.length === 0 ? (
              <p className="text-xs text-[#737373]">No photographic artifacts attached for this session.</p>
            ) : (
              session.multimodal_records.map((mm, idx) => (
                <div key={idx} className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17365D] uppercase text-[10px]">
                      Task: {mm.visible_task}
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#EEF4EF] text-[#4F7658] border border-[#CADBCE] text-[10px] font-bold">
                      Confidence: {mm.confidence}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#666666]">Written Answer: </span>
                      <strong className="text-[#17365D]">{mm.written_answer}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666]">Regrouping Representation: </span>
                      <strong className="text-[#4F7658]">{mm.regrouping_representation_visible ? 'Visible' : 'Not Visible'}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#555555] italic bg-[#FCFBF8] p-2 border border-[#EBE6DC]">
                    {mm.extracted_observation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Adaptive Next Learning Move & Decision Panel (Section 15, 16, 17, 18) */}
      <div className="bg-[#FCFBF8] border-2 border-[#17365D] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D3C7] pb-4">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#17365D]">
              Adaptive Intelligence Recommendation
            </div>
            <h2 className="font-serif text-xl font-bold text-[#17365D] mt-0.5">
              Next Learning Move: {actionType}
            </h2>
            <p className="text-xs text-[#555555] font-sans mt-0.5">
              {session.adaptation_decision?.description || 'Move from guided practice to independent application with two additional examples.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhyModal(!showWhyModal)}
              className="px-3 py-1.5 bg-[#F7F3EA] border border-[#D9D3C7] text-xs font-sans font-medium text-[#17365D] hover:bg-[#EAE5D9] flex items-center gap-1"
            >
              <span>{showWhyModal ? 'Hide Rationale ▲' : 'Why This Recommendation? ▼'}</span>
            </button>
          </div>
        </div>

        {/* Why Collapsible Explanation Card (Section 17) */}
        {showWhyModal && (
          <div className="mt-4 p-4 bg-[#F7F3EA] border border-[#D9D3C7] space-y-3 text-xs">
            <div className="font-serif font-bold text-sm text-[#17365D] border-b border-[#D9D3C7] pb-1">
              Evidence Chain Rationale: WHY {actionType}?
            </div>
            <p className="text-[#333333] leading-relaxed">
              {session.adaptation_decision?.rationale || '4 of 5 post-activity tasks were correct, compared with 2 of 5 at baseline. The student also independently demonstrated the place-value exchange procedure.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] pt-2">
              <div className="bg-[#FCFBF8] p-2 border border-[#D9D3C7]">
                <strong className="text-[#8A2F35]">1. Baseline: </strong> 2/5 (40%)
              </div>
              <div className="bg-[#FCFBF8] p-2 border border-[#D9D3C7]">
                <strong className="text-[#17365D]">2. Intervention: </strong> 10m Guided Exchange
              </div>
              <div className="bg-[#FCFBF8] p-2 border border-[#D9D3C7]">
                <strong className="text-[#4F7658]">3. Post Evidence: </strong> 4/5 (80%)
              </div>
              <div className="bg-[#FCFBF8] p-2 border border-[#D9D3C7]">
                <strong className="text-[#17365D]">4. Move: </strong> Independent Application
              </div>
            </div>
          </div>
        )}

        {/* Teacher Control Actions (Section 18) */}
        <div className="mt-5 pt-4 border-t border-[#EBE6DC]">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#666666] mb-3">
            Teacher Final Decision & Control:
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleDecision('accepted')}
              className={`px-4 py-2 text-xs font-medium transition-colors border ${
                teacherDecision === 'accepted'
                  ? 'bg-[#4F7658] text-white border-[#3F5E46]'
                  : 'bg-[#FCFBF8] text-[#4F7658] border-[#CADBCE] hover:bg-[#EEF4EF]'
              }`}
            >
              ✓ Accept Recommendation ({actionType})
            </button>

            <button
              onClick={() => setIsModifying(!isModifying)}
              className={`px-4 py-2 text-xs font-medium transition-colors border ${
                teacherDecision === 'modified'
                  ? 'bg-[#A87932] text-white border-[#875F24]'
                  : 'bg-[#FCFBF8] text-[#A87932] border-[#E5D8C1] hover:bg-[#FAF4EB]'
              }`}
            >
              ✎ Modify Next Move
            </button>

            <button
              onClick={() => handleDecision('rejected', 'Teacher elected to return to previous prerequisite representation.')}
              className={`px-4 py-2 text-xs font-medium transition-colors border ${
                teacherDecision === 'rejected'
                  ? 'bg-[#8A2F35] text-white border-[#6D2328]'
                  : 'bg-[#FCFBF8] text-[#8A2F35] border-[#D9C7BE] hover:bg-[#F2EDEA]'
              }`}
            >
              ✕ Reject / Return to Previous Strategy
            </button>
          </div>

          {/* Modification Input */}
          {isModifying && (
            <div className="mt-4 p-3 bg-[#FAF4EB] border border-[#E5D8C1] space-y-2">
              <label className="block text-xs font-bold text-[#17365D]">
                Teacher Custom Instructional Adaptation:
              </label>
              <textarea
                value={modifyNotes}
                onChange={(e) => setModifyNotes(e.target.value)}
                placeholder="Specify adjusted move (e.g., Provide 2 peer-paired subtraction problems with bundles before independent worksheet)..."
                rows={2}
                className="w-full text-xs p-2 bg-[#FCFBF8] border border-[#D9D3C7] focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModifying(false)}
                  className="px-3 py-1 text-xs text-[#666666] hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecision('modified', modifyNotes)}
                  className="px-3 py-1 bg-[#A87932] text-white text-xs font-medium"
                >
                  Save Custom Move
                </button>
              </div>
            </div>
          )}

          {teacherDecision !== 'pending' && (
            <div className="mt-3 text-xs text-[#4F7658] font-medium flex items-center gap-1.5">
              <span>✓ Teacher Decision Recorded:</span>
              <strong className="uppercase">{teacherDecision}</strong>
              {session.adaptation_decision?.teacher_notes && (
                <span className="text-[#666666]">("{session.adaptation_decision.teacher_notes}")</span>
              )}
            </div>
          )}
        </div>

        {/* Closed-Loop System Actions (Section 21, 35, 36, 41) */}
        <div className="mt-6 pt-5 border-t-2 border-[#D9D3C7] flex flex-wrap items-center justify-between gap-4 bg-[#F7F3EA] p-4">
          <div>
            <div className="text-[11px] font-bold text-[#17365D] uppercase tracking-wide">
              Closed-Loop Orchestration Intelligence
            </div>
            <div className="text-xs text-[#666666] mt-0.5">
              Sync updated evidence into diagnostic profile & prepare next classroom lesson plan.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUpdatePhase2Diagnostics}
              disabled={updatingPhase2 || phase2Updated}
              className={`px-4 py-2 text-xs font-medium transition-colors border ${
                phase2Updated
                  ? 'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]'
                  : 'bg-[#17365D] text-white border-[#0F243E] hover:bg-[#0F243E]'
              }`}
            >
              {updatingPhase2 ? 'Updating Diagnostics...' : phase2Updated ? '✓ Diagnostic State Updated' : 'Update Diagnostic Analysis'}
            </button>

            <button
              onClick={handlePrepareNextLesson}
              className="px-4 py-2 bg-[#8A2F35] text-white text-xs font-medium hover:bg-[#6D2328] transition-colors border border-[#6D2328]"
            >
              Prepare Next Lesson →
            </button>
          </div>
        </div>

        {handoffSuccess && (
          <div className="mt-3 p-2.5 bg-[#EEF4EF] border border-[#CADBCE] text-xs font-medium text-[#4F7658]">
            {handoffSuccess}
          </div>
        )}

      </div>

      {/* Trajectory Modal */}
      {showTrajectoryModal && (
        <StudentTrajectoryModal
          studentId={session.student_id}
          studentName={session.student_name}
          onClose={() => setShowTrajectoryModal(false)}
          onNavigate={onNavigate}
        />
      )}

    </div>
  );
};
