import React, { useEffect, useState } from 'react';
import { api, StudentLearningTrajectory } from '../services/api';

interface StudentTrajectoryModalProps {
  studentId: string;
  studentName?: string;
  onClose: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const StudentTrajectoryModal: React.FC<StudentTrajectoryModalProps> = ({
  studentId,
  studentName,
  onClose,
  onNavigate
}) => {
  const [trajectory, setTrajectory] = useState<StudentLearningTrajectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrajectory();
  }, [studentId]);

  const loadTrajectory = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentLearningTrajectory(studentId);
      setTrajectory(data);
    } catch (e) {
      console.error('Failed to load trajectory', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-none shadow-xl max-w-4xl w-full my-8 text-[#252525]">
        
        {/* Institutional Header */}
        <div className="bg-[#17365D] text-[#FCFBF8] px-6 py-4 flex items-center justify-between border-b border-[#0F243E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-[#E5D8C1]">
                Longitudinal Learning Record
              </span>
              <span className="text-[11px] text-[#A6C0DE]">• Closed-Loop Intelligence</span>
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-white mt-0.5">
              {trajectory?.student_name || studentName || 'Student'} — Learning Trajectory
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#E5D8C1] hover:text-white text-sm font-sans px-2.5 py-1 border border-[#3A5D86] hover:border-white transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-sans text-[#666666]">
            Compiling longitudinal learning trajectory across Phase 1, 2, 3 & 4...
          </div>
        ) : trajectory ? (
          <div className="p-6 space-y-6">
            
            {/* Trajectory Sequential Stage Map (Section 21) */}
            <div className="bg-[#F7F3EA] border border-[#D9D3C7] p-5">
              <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#17365D] mb-3">
                Continuous Learning Intelligence Loop
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-xs">
                
                {/* Phase 1 */}
                <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3">
                  <div className="text-[10px] font-bold text-[#666666] uppercase">Phase 1: Assess</div>
                  <div className="font-serif font-bold text-[#17365D] mt-1 text-sm">Baseline</div>
                  <div className="text-xs font-mono font-bold text-[#8A2F35] mt-1">
                    {trajectory.baseline_evidence}
                  </div>
                  <div className="text-[10px] text-[#666666] mt-0.5">Assessed Tasks</div>
                </div>

                {/* Phase 2 */}
                <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3">
                  <div className="text-[10px] font-bold text-[#666666] uppercase">Phase 2: Diagnose</div>
                  <div className="font-serif font-bold text-[#8A2F35] mt-1 text-sm">Hypothesis</div>
                  <div className="text-[11px] font-medium text-[#252525] mt-1 leading-snug">
                    {trajectory.diagnostic_hypothesis}
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3">
                  <div className="text-[10px] font-bold text-[#666666] uppercase">Phase 3: Orchestrate</div>
                  <div className="font-serif font-bold text-[#17365D] mt-1 text-sm">Path Assigned</div>
                  <div className="text-[11px] font-medium text-[#252525] mt-1 leading-snug">
                    {trajectory.instructional_path_title}
                  </div>
                </div>

                {/* Phase 4 */}
                <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3">
                  <div className="text-[10px] font-bold text-[#666666] uppercase">Phase 4: Teach</div>
                  <div className="font-serif font-bold text-[#4F7658] mt-1 text-sm">Intervention Evidence</div>
                  <div className="text-xs font-mono font-bold text-[#4F7658] mt-1">
                    {trajectory.intervention_evidence}
                  </div>
                  <div className="text-[10px] text-[#666666] mt-0.5">Post-Check Tasks</div>
                </div>

                {/* Current State */}
                <div className="bg-[#FCFBF8] border border-[#A87932] p-3">
                  <div className="text-[10px] font-bold text-[#A87932] uppercase">Current State</div>
                  <div className="font-serif font-bold text-[#A87932] mt-1 text-sm">Response</div>
                  <div className="inline-block mt-1 px-1.5 py-0.5 bg-[#FAF4EB] border border-[#E5D8C1] text-[10px] font-bold text-[#A87932]">
                    {trajectory.current_response_status.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Next Move */}
                <div className="bg-[#FCFBF8] border border-[#17365D] p-3">
                  <div className="text-[10px] font-bold text-[#17365D] uppercase">Next Move</div>
                  <div className="font-serif font-bold text-[#17365D] mt-1 text-sm">Adaptive Action</div>
                  <div className="text-[11px] font-semibold text-[#17365D] mt-1 leading-snug">
                    {trajectory.next_learning_move}
                  </div>
                </div>

              </div>
            </div>

            {/* Evidence Timeline (Section 22) */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#D9D3C7] pb-1.5">
                <h3 className="font-serif font-bold text-base text-[#17365D]">
                  Evidence Timeline & Traceability Log
                </h3>
                <span className="text-[11px] text-[#666666] font-mono">
                  Session Date: 24 September 2026
                </span>
              </div>

              <div className="border border-[#D9D3C7] bg-[#FCFBF8] divide-y divide-[#EBE6DC]">
                {trajectory.timeline.map((entry, idx) => (
                  <div key={idx} className="p-3.5 flex items-start gap-4 hover:bg-[#F9F7F2] transition-colors">
                    <div className="w-16 shrink-0 text-xs font-mono font-bold text-[#17365D]">
                      {entry.timestamp}
                    </div>
                    <div className="w-24 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                        entry.phase.includes('Phase 1') ? 'bg-[#FAF4EB] text-[#8A2F35] border-[#E5D8C1]' :
                        entry.phase.includes('Phase 2') ? 'bg-[#F2EDEA] text-[#8A2F35] border-[#D9C7BE]' :
                        entry.phase.includes('Phase 3') ? 'bg-[#EAEFF5] text-[#17365D] border-[#C5D3E3]' :
                        'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]'
                      }`}>
                        {entry.phase}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-xs text-[#252525]">
                          {entry.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#17365D]">
                          [{entry.metric_or_status}]
                        </span>
                      </div>
                      <p className="text-xs text-[#555555] mt-0.5 leading-relaxed font-sans">
                        {entry.detail}
                      </p>
                      {entry.evidence_trace_id && (
                        <div className="text-[10px] font-mono text-[#8E8B82] mt-1">
                          Trace ID: {entry.evidence_trace_id}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Causality Institutional Notice */}
            <div className="bg-[#FAF4EB] border-l-4 border-[#A87932] p-3 text-xs text-[#666666]">
              <span className="font-semibold text-[#252525]">Institutional Measurement Note: </span>
              Evidence after the instructional activity shows improvement on the assessed tasks. 
              The system documents demonstrated task performance and strategy execution without asserting autonomous causal claims.
            </div>

          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#8A2F35]">
            Unable to load learning trajectory for this student.
          </div>
        )}

        {/* Footer Controls */}
        <div className="bg-[#F7F3EA] border-t border-[#D9D3C7] px-6 py-3.5 flex items-center justify-between">
          <div className="text-[11px] text-[#666666]">
            Source: Foundational Learning Conductor — Multi-Phase Synthesis
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] transition-colors"
          >
            Close Trajectory
          </button>
        </div>

      </div>
    </div>
  );
};
