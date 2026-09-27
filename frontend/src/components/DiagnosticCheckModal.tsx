import React, { useState } from 'react';
import { DiagnosticCheck, DiagnosticResponse } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';

interface DiagnosticCheckModalProps {
  studentId: string;
  studentName: string;
  check: DiagnosticCheck;
  onClose: () => void;
  onComplete: (responses: DiagnosticResponse[]) => Promise<void>;
}

export const DiagnosticCheckModal: React.FC<DiagnosticCheckModalProps> = ({
  studentId,
  studentName,
  check,
  onClose,
  onComplete
}) => {
  const [taskResponses, setTaskResponses] = useState<Record<string, {
    student_response: string;
    correct: boolean;
    teacher_observation?: string;
  }>>({
    // Pre-populate with typical responses for ease of demonstration
    [check.tasks[0]?.id || 'DIAG_PV_01']: { student_response: check.tasks[0]?.expected_response || '', correct: true },
    [check.tasks[1]?.id || 'DIAG_PV_02']: { student_response: check.tasks[1]?.expected_response || '', correct: true },
    [check.tasks[2]?.id || 'DIAG_PV_03']: { student_response: 'incorrect exchange', correct: false }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkTask = (taskId: string, isCorrect: boolean) => {
    setTaskResponses(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        correct: isCorrect
      }
    }));
  };

  const handleResponseChange = (taskId: string, val: string) => {
    setTaskResponses(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        student_response: val
      }
    }));
  };

  const handleObservationChange = (taskId: string, val: string) => {
    setTaskResponses(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        teacher_observation: val
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const responsesPayload: DiagnosticResponse[] = check.tasks.map(t => {
        const item = taskResponses[t.id] || { student_response: t.expected_response, correct: true };
        return {
          task_id: t.id,
          student_response: item.student_response,
          correct: item.correct,
          teacher_observation: item.teacher_observation
        };
      });

      await onComplete(responsesPayload);
      onClose();
    } catch (e) {
      alert('Error updating diagnostic check.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 font-sans overflow-y-auto">
      <div className="bg-[#FCFBF8] rounded-[6px] border border-[#B8B0A2] max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
        
        {/* Header (Screen 10) */}
        <div className="pb-3 border-b border-[#D9D3C7] flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A2F35]">
              Screen 10: Targeted Prerequisite Check
            </span>
            <h2 className="font-serif font-bold text-xl text-[#17365D]">
              Diagnostic Check: {check.prerequisite_skill}
            </h2>
            <p className="text-xs text-[#666666]">
              Student: <b className="text-[#252525]">{studentName}</b> ({studentId})
            </p>
          </div>
          <button onClick={onClose} className="text-[#737373] hover:text-[#252525] text-sm">
            ✕
          </button>
        </div>

        {/* Purpose Callout */}
        <div className="bg-[#FAF4EB] border-l-3 border-l-[#A87932] border border-[#E5D8C1] rounded-[3px] p-3 text-xs text-[#8F6627]">
          <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
            Diagnostic Objective:
          </span>
          {check.purpose}
        </div>

        {/* 3 Tasks Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {check.tasks.map((task, idx) => {
            const currentResp = taskResponses[task.id] || { student_response: '', correct: true };
            return (
              <div 
                key={task.id} 
                className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 space-y-2.5"
              >
                <div className="flex items-baseline justify-between border-b border-[#EFECE5] pb-1.5">
                  <span className="font-bold text-[#17365D] uppercase tracking-wide text-[11px]">
                    Task {idx + 1} of {check.tasks.length} [{task.id}]
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    Expected: <b className="font-mono text-[#525252]">{task.expected_response}</b>
                  </span>
                </div>

                <div className="font-serif text-sm font-semibold text-[#252525]">
                  {task.prompt}
                </div>

                <div className="text-[11px] text-[#666666] italic bg-[#F1EEE7] p-2 rounded-[3px]">
                  Teacher Guidance: {task.instructions_for_teacher}
                </div>

                {/* Input & Evaluation */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter student response..."
                    value={currentResp.student_response}
                    onChange={e => handleResponseChange(task.id, e.target.value)}
                    className="w-full sm:w-1/2 px-2.5 py-1.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] focus:outline-none focus:border-[#17365D]"
                  />

                  <div className="w-full sm:w-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMarkTask(task.id, true)}
                      className={`flex-1 py-1 px-2.5 rounded-[4px] border text-xs font-bold transition-colors ${
                        currentResp.correct
                          ? 'bg-[#4F7658] text-[#FCFBF8] border-[#4F7658]'
                          : 'bg-[#EDF3EE] text-[#3B5E43] border-[#C6D8CA]'
                      }`}
                    >
                      ✓ Correct
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkTask(task.id, false)}
                      className={`flex-1 py-1 px-2.5 rounded-[4px] border text-xs font-bold transition-colors ${
                        !currentResp.correct
                          ? 'bg-[#9A4A4A] text-[#FCFBF8] border-[#9A4A4A]'
                          : 'bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1]'
                      }`}
                    >
                      ✕ Incorrect
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Optional observation (e.g. used mental decomposition, hesitated)..."
                  value={currentResp.teacher_observation || ''}
                  onChange={e => handleObservationChange(task.id, e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-[#E5E0D6] rounded-[3px] bg-[#FCFBF8] focus:outline-none"
                />
              </div>
            );
          })}

          {/* Quick Demo Shortcut Buttons to show AI changing its mind */}
          <div className="p-3 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[4px] text-[11px] flex items-center justify-between">
            <span className="text-[#666666] font-semibold">Demo Scenario Presets:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTaskResponses({
                    [check.tasks[0]?.id]: { student_response: check.tasks[0]?.expected_response, correct: true },
                    [check.tasks[1]?.id]: { student_response: check.tasks[1]?.expected_response, correct: true },
                    [check.tasks[2]?.id]: { student_response: check.tasks[2]?.expected_response, correct: true }
                  });
                }}
                className="px-2 py-0.5 bg-[#EDF3EE] text-[#3B5E43] border border-[#C6D8CA] rounded-[3px] hover:bg-[#DCE7DE]"
                title="Sets 3/3 tasks correct to demonstrate hypothesis WEAKENED"
              >
                Simulate 3/3 Correct (Weakened)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskResponses({
                    [check.tasks[0]?.id]: { student_response: 'incorrect', correct: false },
                    [check.tasks[1]?.id]: { student_response: 'incorrect', correct: false },
                    [check.tasks[2]?.id]: { student_response: check.tasks[2]?.expected_response, correct: true }
                  });
                }}
                className="px-2 py-0.5 bg-[#FAF4EB] text-[#8F6627] border border-[#E5D8C1] rounded-[3px] hover:bg-[#F3E7D3]"
                title="Sets 1/3 tasks correct to demonstrate hypothesis SUPPORTED"
              >
                Simulate 1/3 Correct (Supported)
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#D9D3C7]">
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="maroon"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Evaluating...' : 'Ingest New Evidence & Update Hypothesis →'}
            </ActionButton>
          </div>
        </form>

      </div>
    </div>
  );
};
