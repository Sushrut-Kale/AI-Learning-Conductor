import React, { useState } from 'react';
import { InstructionalPath, PathMembership } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';
import { OrchestrationWhyModal } from './OrchestrationWhyModal';

interface InstructionalPathCardProps {
  path: InstructionalPath;
  onUpdateDuration: (pathId: string, minutes: number) => void;
  onUpdateAttention: (pathId: string, attention: string) => void;
  onViewStudentDiagnostic?: (studentId: string) => void;
}

export const InstructionalPathCard: React.FC<InstructionalPathCardProps> = ({
  path,
  onUpdateDuration,
  onUpdateAttention,
  onViewStudentDiagnostic
}) => {
  const [showStudents, setShowStudents] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<PathMembership | null>(null);

  const getAttentionBadge = (attention: string) => {
    switch (attention) {
      case 'required':
        return {
          bg: 'bg-[#8A2F35] text-[#FCFBF8] border-[#5E1E22]',
          label: 'Direct Teacher Support (Required)'
        };
      case 'quick_check':
        return {
          bg: 'bg-[#A87932] text-[#FCFBF8] border-[#73511F]',
          label: 'Quick Teacher Check (5-7m)'
        };
      case 'recommended':
        return {
          bg: 'bg-[#A87932] text-[#FCFBF8] border-[#73511F]',
          label: 'Peer-Supported / Partner'
        };
      case 'independent':
      default:
        return {
          bg: 'bg-[#17365D] text-[#FCFBF8] border-[#0F243E]',
          label: 'Independent Consolidation'
        };
    }
  };

  const badge = getAttentionBadge(path.teacher_attention);

  return (
    <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] overflow-hidden shadow-xs font-sans transition-all hover:border-[#B8B0A2]">
      {/* Path Header */}
      <div className="bg-[#F1EEE7] border-b border-[#D9D3C7] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-serif font-bold text-sm text-[#17365D]">
            {path.title}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#E5D8C1] text-[#252525] font-semibold">
            {path.students.length} Students
          </span>
          <span className="text-[10px] font-sans uppercase font-bold px-1.5 py-0.2 rounded-xs bg-white text-[#737373] border border-[#D9D3C7]">
            {path.domain}
          </span>
        </div>

        {/* Teacher Attention & Duration Control Strip */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs border ${badge.bg}`}>
            {badge.label}
          </span>
          
          {/* Duration Adjuster */}
          <div className="flex items-center border border-[#D9D3C7] bg-[#FCFBF8] rounded-xs text-[11px] font-mono">
            <button
              onClick={() => onUpdateDuration(path.id, Math.max(3, path.duration_minutes - 2))}
              className="px-1.5 py-0.5 hover:bg-[#EFECE5] text-[#525252]"
              title="Decrease duration by 2 minutes"
            >
              -
            </button>
            <span className="px-1.5 font-bold text-[#17365D]">
              {path.duration_minutes}m
            </span>
            <button
              onClick={() => onUpdateDuration(path.id, path.duration_minutes + 2)}
              className="px-1.5 py-0.5 hover:bg-[#EFECE5] text-[#525252]"
              title="Increase duration by 2 minutes"
            >
              +
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedStudent(null);
              setShowWhyModal(true);
            }}
            className="text-[11px] font-semibold text-[#8A2F35] hover:text-[#5E1E22] hover:underline px-1"
          >
            [ Why? ]
          </button>
        </div>
      </div>

      {/* Path Body */}
      <div className="p-4 space-y-4 text-xs">
        {/* Focus & Next Move */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
              Instructional Focus
            </span>
            <span className="text-[11px] font-semibold text-[#17365D]">
              {path.learning_focus}
            </span>
          </div>
          <div className="bg-[#FAF4EB] border-l-2 border-[#8A2F35] p-2.5 rounded-xs text-[#252525] font-serif text-[12px] leading-relaxed">
            <b className="font-sans text-[10px] text-[#8A2F35] uppercase tracking-wide block mb-0.5">
              Next Learning Move:
            </b>
            {path.next_learning_move}
          </div>
        </div>

        {/* 4-Step Activity Structure (Section 19: START -> GUIDED -> INDEPENDENT -> EXIT) */}
        <div className="space-y-2 pt-1 border-t border-[#D9D3C7]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
            4-Stage Activity Progression
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* Start */}
            <div className="p-2 bg-[#FCFBF8] border border-[#E5E0D5] rounded-xs space-y-1">
              <span className="text-[9px] font-bold text-[#17365D] uppercase tracking-wider block">
                1. START (Teacher Model / Hook)
              </span>
              <p className="text-[#333333] leading-snug">
                {path.activity.start_activity}
              </p>
            </div>

            {/* Guided */}
            <div className="p-2 bg-[#FCFBF8] border border-[#E5E0D5] rounded-xs space-y-1">
              <span className="text-[9px] font-bold text-[#8A2F35] uppercase tracking-wider block">
                2. GUIDED (Solve Together / Pair)
              </span>
              <p className="text-[#333333] leading-snug">
                {path.activity.guided_activity}
              </p>
            </div>

            {/* Independent */}
            <div className="p-2 bg-[#FCFBF8] border border-[#E5E0D5] rounded-xs space-y-1">
              <span className="text-[9px] font-bold text-[#A87932] uppercase tracking-wider block">
                3. INDEPENDENT (Student Attempt)
              </span>
              <p className="text-[#333333] leading-snug">
                {path.activity.independent_activity}
              </p>
            </div>

            {/* Exit */}
            <div className="p-2 bg-[#EDF3EE] border border-[#C5D8C8] rounded-xs space-y-1">
              <span className="text-[9px] font-bold text-[#4F7658] uppercase tracking-wider block">
                4. EXIT (Micro-Evidence Check)
              </span>
              <p className="text-[#252525] font-medium leading-snug">
                {path.activity.exit_activity}
              </p>
            </div>
          </div>
        </div>

        {/* Resources checklist */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#666666] pt-1">
          <span className="font-semibold text-[#525252]">Materials:</span>
          {path.activity.materials_needed.map((m, idx) => (
            <span key={idx} className="bg-[#F1EEE7] px-1.5 py-0.2 rounded-xs border border-[#D9D3C7]">
              {m}
            </span>
          ))}
        </div>

        {/* Student Membership Accordion Button */}
        <div className="pt-2 border-t border-[#D9D3C7] flex items-center justify-between">
          <button
            onClick={() => setShowStudents(!showStudents)}
            className="text-xs font-semibold text-[#17365D] hover:underline flex items-center gap-1.5"
          >
            <span>{showStudents ? '▼ Hide' : '▶ View'} {path.students.length} Assigned Students</span>
          </button>
          
          <div className="text-[10px] text-[#737373]">
            Path ID: <span className="font-mono">{path.id}</span>
          </div>
        </div>

        {/* Expanded Student List */}
        {showStudents && (
          <div className="bg-[#F7F3EA] border border-[#D9D3C7] rounded-[3px] p-2 space-y-1.5 max-h-56 overflow-y-auto">
            {path.students.map((st) => (
              <div
                key={st.student_id}
                className="bg-[#FCFBF8] border border-[#D9D3C7] p-2 rounded-xs flex items-center justify-between text-xs hover:border-[#17365D] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-[#17365D]">
                      {st.student_name}
                    </span>
                    <span className="text-[10px] font-mono text-[#737373]">
                      ({st.student_id})
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-xs border ${
                      st.hypothesis_status === 'weakened'
                        ? 'bg-[#EAF3EC] text-[#3B5E43] border-[#C5D8C8]'
                        : st.hypothesis_status === 'supported'
                        ? 'bg-[#FAF4EB] text-[#8F6627] border-[#E5D8C1]'
                        : 'bg-[#F9EDED] text-[#873F3F] border-[#E8C2C2]'
                    }`}>
                      Hypothesis: {st.hypothesis_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#525252] mt-0.5 line-clamp-1">
                    {st.next_learning_move}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedStudent(st);
                      setShowWhyModal(true);
                    }}
                    className="text-[10px] text-[#8A2F35] hover:underline font-semibold"
                    title="View why student is in this path"
                  >
                    Why?
                  </button>
                  {onViewStudentDiagnostic && (
                    <button
                      onClick={() => onViewStudentDiagnostic(st.student_id)}
                      className="text-[10px] text-[#17365D] hover:underline"
                      title="Inspect Phase 2 Gap Analysis"
                    >
                      Diagnose →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Why Modal */}
      {showWhyModal && (
        <OrchestrationWhyModal
          path={path}
          student={selectedStudent}
          onClose={() => setShowWhyModal(false)}
          onViewDiagnostic={onViewStudentDiagnostic}
        />
      )}
    </div>
  );
};
