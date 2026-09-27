import React from 'react';
import { InstructionalPath, PathMembership } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';

interface OrchestrationWhyModalProps {
  path: InstructionalPath;
  student?: PathMembership | null;
  onClose: () => void;
  onViewDiagnostic?: (studentId: string) => void;
}

export const OrchestrationWhyModal: React.FC<OrchestrationWhyModalProps> = ({
  path,
  student,
  onClose,
  onViewDiagnostic
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs">
      <div className="bg-[#FCFBF8] border border-[#B8B0A2] rounded-[6px] max-w-2xl w-full shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#17365D] text-[#FCFBF8] px-5 py-3.5 flex items-center justify-between border-b border-[#0F243E]">
          <div>
            <h3 className="font-serif font-bold text-base tracking-tight">
              Instructional Decision Traceability (Why?)
            </h3>
            <p className="text-[11px] text-[#D6E2EF]">
              Evidence-based rationale linking Phase 1, Phase 2, and Phase 3 Orchestration
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#D6E2EF] hover:text-[#FCFBF8] text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#252525]">
          {/* Target Entity */}
          <div className="p-3 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[4px] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8A2F35] uppercase tracking-wider block">
                {student ? 'STUDENT PATH MEMBERSHIP' : 'INSTRUCTIONAL PATH'}
              </span>
              <span className="font-serif font-bold text-sm text-[#17365D]">
                {student ? `${student.student_name} (${student.student_id})` : path.title}
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-xs uppercase tracking-wide border ${
              path.teacher_attention === 'required'
                ? 'bg-[#8A2F35] text-[#FCFBF8] border-[#5E1E22]'
                : path.teacher_attention === 'quick_check' || path.teacher_attention === 'recommended'
                ? 'bg-[#A87932] text-[#FCFBF8] border-[#73511F]'
                : 'bg-[#17365D] text-[#FCFBF8] border-[#0E233C]'
            }`}>
              Teacher Attention: {path.teacher_attention.replace('_', ' ')}
            </span>
          </div>

          {/* Reasoning Chain */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#17365D] border-b border-[#D9D3C7] pb-1">
              Multi-Phase Reasoning Chain
            </h4>

            {/* Step 1: Phase 1 Evidence */}
            <div className="border-l-2 border-[#17365D] pl-3 py-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#17365D]">
                Phase 1 — Observed Evidence Baseline
              </span>
              <p className="text-[12px] font-serif text-[#252525]">
                {student
                  ? student.evidence_basis
                  : `Classroom baseline assessment identified ${path.students.length} students exhibiting targeted learning patterns in ${path.learning_focus}.`}
              </p>
            </div>

            {/* Step 2: Phase 2 Pattern & Hypothesis */}
            <div className="border-l-2 border-[#8A2F35] pl-3 py-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A2F35]">
                Phase 2 — Diagnostic Pattern & Prerequisite Gap
              </span>
              <p className="text-[12px] font-serif text-[#252525]">
                {path.rationale}
              </p>
              {student && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-[#525252]">
                    Hypothesis State: <b className="font-mono text-[#8A2F35] uppercase">{student.hypothesis_status}</b>
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Phase 2 Next Learning Move */}
            <div className="border-l-2 border-[#4F7658] pl-3 py-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F7658]">
                Phase 2 — Recommended Next Learning Move
              </span>
              <p className="text-[12px] font-serif text-[#252525]">
                {student ? student.next_learning_move : path.next_learning_move}
              </p>
            </div>

            {/* Step 4: Phase 3 Orchestration Constraint */}
            <div className="border-l-2 border-[#A87932] pl-3 py-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A87932]">
                Phase 3 — Teacher Attention Resource Allocation
              </span>
              <p className="text-[12px] font-serif text-[#252525]">
                Given a single teacher and a 40-minute classroom session, direct teacher support is concentrated for {path.duration_minutes} minutes on {path.title}. Meanwhile, other paths operate with self-checking flashcards or textbook problem exercises.
              </p>
            </div>
          </div>

          {/* Micro-Evidence Exit Activity */}
          <div className="bg-[#FAF4EB] border border-[#E5D8C1] p-3 rounded-[4px] space-y-1.5">
            <span className="text-[10px] font-bold text-[#8F6627] uppercase tracking-wider block">
              Required Exit Micro-Evidence
            </span>
            <p className="text-xs text-[#252525]">
              {path.activity.exit_activity}
            </p>
            <p className="text-[11px] text-[#737373]">
              Exit responses will immediately flow back into Phase 2 to update each student's diagnostic hypothesis.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F1EEE7] border-t border-[#D9D3C7] px-5 py-3 flex items-center justify-between">
          <div>
            {student && onViewDiagnostic && (
              <button
                onClick={() => {
                  onClose();
                  onViewDiagnostic(student.student_id);
                }}
                className="text-xs font-semibold text-[#8A2F35] hover:underline"
              >
                Inspect Full Phase 2 Gap Analysis →
              </button>
            )}
          </div>
          <ActionButton variant="secondary" size="sm" onClick={onClose}>
            Close Record
          </ActionButton>
        </div>
      </div>
    </div>
  );
};
