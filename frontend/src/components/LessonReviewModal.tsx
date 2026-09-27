import React, { useState } from 'react';
import { LessonReviewData, api } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';

interface LessonReviewModalProps {
  planId: string;
  onClose: () => void;
  onNavigate: (screen: string, param?: any) => void;
}

export const LessonReviewModal: React.FC<LessonReviewModalProps> = ({
  planId,
  onClose,
  onNavigate
}) => {
  const [review, setReview] = useState<LessonReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateSignals, setUpdateSignals] = useState<any[]>([]);

  React.useEffect(() => {
    loadReview();
  }, [planId]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const data = await api.getLessonReview(planId);
      setReview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiagnostics = async () => {
    setIsUpdating(true);
    try {
      const res = await api.updateDiagnosticsFromOrchestration(planId);
      setUpdateSuccess(true);
      setUpdateSignals(res.updated_students || []);
    } catch (e) {
      console.error(e);
      alert('Error syncing to diagnostic engine.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !review) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
        <div className="bg-[#FCFBF8] border border-[#B8B0A2] rounded-[6px] p-6 text-xs text-[#666666]">
          Compiling classroom session review and micro-evidence telemetry...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs">
      <div className="bg-[#FCFBF8] border border-[#B8B0A2] rounded-[6px] max-w-2xl w-full shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#17365D] text-[#FCFBF8] px-5 py-3.5 flex items-center justify-between border-b border-[#0F243E]">
          <div>
            <h3 className="font-serif font-bold text-base tracking-tight">
              Classroom Lesson Review & Telemetry (Screen 14)
            </h3>
            <p className="text-[11px] text-[#D6E2EF]">
              Summary of reached students, captured micro-evidence, and closed-loop learning signals
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
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[4px]">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                Students Reached
              </span>
              <span className="font-serif font-bold text-xl text-[#17365D]">
                {review.students_reached}
              </span>
              <span className="text-[10px] text-[#525252] block mt-0.5">
                Full class participation
              </span>
            </div>

            <div className="p-3 bg-[#EDF3EE] border border-[#C5D8C8] rounded-[4px]">
              <span className="text-[10px] font-bold text-[#3B5E43] uppercase tracking-wider block">
                Micro-Evidence Items
              </span>
              <span className="font-serif font-bold text-xl text-[#4F7658]">
                {review.evidence_collected_count}
              </span>
              <span className="text-[10px] text-[#3B5E43] block mt-0.5">
                Exit slips evaluated
              </span>
            </div>

            <div className="p-3 bg-[#FAF4EB] border border-[#E5D8C1] rounded-[4px]">
              <span className="text-[10px] font-bold text-[#8F6627] uppercase tracking-wider block">
                Observations Logged
              </span>
              <span className="font-serif font-bold text-xl text-[#A87932]">
                {review.observations_logged_count}
              </span>
              <span className="text-[10px] text-[#8F6627] block mt-0.5">
                Live qualitative notes
              </span>
            </div>
          </div>

          {/* Path Outcomes Breakdown */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-[#17365D] border-b border-[#D9D3C7] pb-1">
              Path Performance Outcomes
            </h4>
            <div className="space-y-1.5">
              {review.path_summaries.map(p => (
                <div
                  key={p.path_id}
                  className="p-2.5 bg-[#FCFBF8] border border-[#D9D3C7] rounded-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-serif font-bold text-[#17365D] mr-2">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      ({p.student_count} Students)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-[#3B5E43] font-bold">
                      ✓ {p.demonstrated} Demonstrated
                    </span>
                    <span className="text-[#8F6627]">
                      ◐ {p.emerging} Emerging
                    </span>
                    <span className="text-[#873F3F]">
                      ✕ {p.requires_review} Review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Learning Signals (Section 26) */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-[#17365D] border-b border-[#D9D3C7] pb-1">
              New Emerging Learning Signals
            </h4>
            <div className="space-y-2">
              {review.new_learning_signals.map(sig => (
                <div
                  key={sig.student_id}
                  className="p-3 bg-[#FAF4EB] border-l-3 border-[#8A2F35] rounded-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#17365D]">
                      {sig.student_name}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-xs bg-[#4F7658] text-[#FCFBF8]">
                      Signal Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-[#252525]">
                    {sig.signal}
                  </p>
                  <p className="text-[11px] text-[#737373] italic">
                    Action: {sig.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Success Banner if Updated */}
          {updateSuccess && (
            <div className="p-3 bg-[#EDF3EE] border border-[#C5D8C8] rounded-[4px] space-y-1 text-xs">
              <span className="font-bold text-[#3B5E43] block">
                ✓ Diagnostic Insights Updated Successfully!
              </span>
              <p className="text-[#252525]">
                New live lesson evidence has been incorporated into student profiles. Aarav Sharma's regrouping hypothesis has transitioned to <b>WEAKENED/RESOLVED</b>, and his Next Learning Move has progressed to multi-step word problems.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F1EEE7] border-t border-[#D9D3C7] px-5 py-3 flex items-center justify-between">
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close Summary
          </ActionButton>

          <div className="flex items-center gap-2">
            {!updateSuccess ? (
              <ActionButton
                variant="maroon"
                size="sm"
                onClick={handleUpdateDiagnostics}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating Insights...' : 'Update Learning Insights →'}
              </ActionButton>
            ) : (
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigate('diagnostic_overview', { classId: 'CLS_G3A' });
                }}
              >
                Inspect Updated Classroom Diagnostics →
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
