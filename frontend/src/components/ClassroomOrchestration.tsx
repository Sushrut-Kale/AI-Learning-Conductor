import React, { useState, useEffect } from 'react';
import {
  api,
  ClassroomPlan,
  ClassroomOrchestrationOverview,
  OrchestrationBuildRequest
} from '../services/api';
import { PageHeader, SectionHeader, ActionButton } from './common/InstitutionalUI';
import { ClassroomTimeline } from './ClassroomTimeline';
import { InstructionalPathCard } from './InstructionalPathCard';
import { ClassroomLandscape } from './ClassroomLandscape';
import { LessonReviewModal } from './LessonReviewModal';

interface ClassroomOrchestrationProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const ClassroomOrchestration: React.FC<ClassroomOrchestrationProps> = ({
  classId,
  onNavigate
}) => {
  const [overview, setOverview] = useState<ClassroomOrchestrationOverview | null>(null);
  const [plan, setPlan] = useState<ClassroomPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number>(40);
  const [selectedResources, setSelectedResources] = useState<string[]>([
    'Blackboard',
    'Textbook',
    'Notebook',
    'Printed worksheet'
  ]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    loadOrchestrationData();
  }, [classId]);

  const loadOrchestrationData = async () => {
    setLoading(true);
    try {
      const ov = await api.getClassroomOrchestration(classId || 'CLS_G3A');
      setOverview(ov);
      if (ov.existing_plan) {
        setPlan(ov.existing_plan);
        setSelectedDuration(ov.existing_plan.duration_minutes);
      } else {
        // Build initial plan
        const newPlan = await api.buildClassroomOrchestration(classId || 'CLS_G3A', {
          duration_minutes: selectedDuration,
          available_resources: selectedResources
        });
        setPlan(newPlan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildPlan = async (duration?: number) => {
    setIsBuilding(true);
    try {
      const dur = duration || selectedDuration;
      const req: OrchestrationBuildRequest = {
        lesson_topic: 'Two-Digit Subtraction with Regrouping',
        duration_minutes: dur,
        available_resources: selectedResources
      };
      const built = await api.buildClassroomOrchestration(classId || 'CLS_G3A', req);
      setPlan(built);
      setSelectedDuration(dur);
    } catch (e) {
      console.error(e);
      alert('Error constructing classroom plan.');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUpdatePathDuration = async (pathId: string, newMinutes: number) => {
    if (!plan) return;
    try {
      const updatedPaths = plan.paths.map(p =>
        p.id === pathId ? { ...p, duration_minutes: newMinutes } : p
      );
      const updated = await api.updateOrchestrationPlan(plan.id, {
        paths: updatedPaths.map(p => ({ id: p.id, duration_minutes: p.duration_minutes }))
      });
      setPlan(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePathAttention = async (pathId: string, attention: string) => {
    if (!plan) return;
    try {
      const updatedPaths = plan.paths.map(p =>
        p.id === pathId ? { ...p, teacher_attention: attention } : p
      );
      const updated = await api.updateOrchestrationPlan(plan.id, {
        paths: updatedPaths.map(p => ({ id: p.id, teacher_attention: p.teacher_attention }))
      });
      setPlan(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleResource = (res: string) => {
    const next = selectedResources.includes(res)
      ? selectedResources.filter(r => r !== res)
      : [...selectedResources, res];
    setSelectedResources(next);
  };

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Analyzing student learning evidence to construct constrained classroom action plan...
      </div>
    );
  }

  const budget = plan.teacher_attention_budget;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumb="Classroom Diagnostics"
        onBreadcrumbClick={() => onNavigate('diagnostic_overview', { classId })}
        title="Classroom Orchestration"
        subtitle={`Grade 3 — Section A • 30 Students • 1 Teacher • ${plan.lesson_topic}`}
        badge="Classroom Orchestration"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => handleBuildPlan()}
              disabled={isBuilding}
            >
              {isBuilding ? 'Synthesizing...' : 'Re-Synthesize Plan'}
            </ActionButton>
            <ActionButton
              variant="maroon"
              onClick={() => onNavigate('live_classroom', { planId: plan.id })}
            >
              Start Live Classroom Mode →
            </ActionButton>
          </div>
        }
      />

      {/* Classroom Constraints & Duration Selector Strip (Sections 15 & 16) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Lesson Duration Buttons */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#17365D] uppercase tracking-wide text-[10px]">
            Lesson Duration:
          </span>
          {[20, 30, 40, 60].map(dur => (
            <button
              key={dur}
              onClick={() => handleBuildPlan(dur)}
              className={`px-3 py-1 font-mono text-xs font-semibold rounded-xs border transition-colors ${
                selectedDuration === dur
                  ? 'bg-[#17365D] text-[#FCFBF8] border-[#0F243E]'
                  : 'bg-[#F1EEE7] text-[#525252] border-[#D9D3C7] hover:bg-[#EAE5D9]'
              }`}
            >
              {dur} min
            </button>
          ))}
          {selectedDuration === 20 && (
            <span className="text-[10px] text-[#8A2F35] font-semibold italic ml-1">
              (High time constraint: Teacher attention prioritized strictly for Path A)
            </span>
          )}
        </div>

        {/* Classroom Resources Checklist */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#17365D] uppercase tracking-wide text-[10px]">
            Resources:
          </span>
          {['Blackboard', 'Textbook', 'Notebook', 'Printed worksheet', 'Tablets'].map(res => (
            <label
              key={res}
              className="flex items-center gap-1 text-[11px] text-[#525252] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedResources.includes(res)}
                onChange={() => handleToggleResource(res)}
                className="rounded-xs text-[#17365D]"
              />
              <span>{res}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Current Learning Patterns & Teacher Attention Budget Row (Sections 6 & 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Current Evaluated Learning Patterns */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3">
          <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
            <h3 className="font-serif font-bold text-sm text-[#17365D]">
              Evaluated Classroom Learning Patterns
            </h3>
            <span className="text-[10px] font-mono text-[#737373]">
              30 Students
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#FAF4EB] border-l-3 border-[#8A2F35] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#8A2F35] block">
                  Subtraction / Regrouping Foundation
                </span>
                <span className="text-[11px] text-[#525252]">
                  Errors concentrated in borrowing across place values
                </span>
              </div>
              <span className="font-serif font-bold text-base text-[#17365D]">
                6 students
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF4EB] border-l-3 border-[#A87932] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#A87932] block">
                  Paragraph / Word Decoding
                </span>
                <span className="text-[11px] text-[#525252]">
                  Reading hesitation on unfamiliar multi-syllable vocabulary
                </span>
              </div>
              <span className="font-serif font-bold text-base text-[#17365D]">
                4 students
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF4EB] border-l-3 border-[#A87932] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#A87932] block">
                  Number Comparison Orientation
                </span>
                <span className="text-[11px] text-[#525252]">
                  Inverted tens vs ones place magnitude evaluation
                </span>
              </div>
              <span className="font-serif font-bold text-base text-[#17365D]">
                3 students
              </span>
            </div>

            <div className="p-2.5 bg-[#F1EEE7] border-l-3 border-[#17365D] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#17365D] block">
                  Independent Consolidation & Application
                </span>
                <span className="text-[11px] text-[#525252]">
                  Core skills demonstrated in baseline; self-directed word problems
                </span>
              </div>
              <span className="font-serif font-bold text-base text-[#17365D]">
                17 students
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Teacher Attention Budget (Section 6) */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3">
          <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#17365D]">
                Teacher Attention Budget Allocation
              </h3>
              <p className="text-[10px] text-[#666666]">
                Maximizing scarce teacher instructional interaction across 40 minutes
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#8A2F35] uppercase">
              1 Teacher Capacity
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 bg-[#FAF4EB] border border-[#E5D8C1] rounded-[4px]">
              <span className="text-[10px] uppercase font-bold text-[#8A2F35] block">
                Direct Teacher Attention
              </span>
              <span className="font-serif font-bold text-lg text-[#8A2F35]">
                {budget.allocated_direct_minutes} min
              </span>
              <span className="text-[10px] text-[#737373] block mt-0.5">
                Path A & Path B
              </span>
            </div>

            <div className="p-3 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[4px]">
              <span className="text-[10px] uppercase font-bold text-[#17365D] block">
                Whole Class / Warm-Up
              </span>
              <span className="font-serif font-bold text-lg text-[#17365D]">
                {budget.whole_class_minutes} min
              </span>
              <span className="text-[10px] text-[#737373] block mt-0.5">
                Hook + Exit slip
              </span>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-[#525252]">
              <span>Teacher Attention Distribution</span>
              <span className="font-mono">{budget.allocated_direct_minutes + budget.whole_class_minutes} / {budget.total_lesson_minutes}m allocated</span>
            </div>
            <div className="w-full h-3 bg-[#E5D8C1] rounded-xs overflow-hidden flex">
              <div
                style={{ width: `${(budget.whole_class_minutes / budget.total_lesson_minutes) * 100}%` }}
                className="bg-[#17365D]"
                title={`Whole Class: ${budget.whole_class_minutes}m`}
              />
              <div
                style={{ width: `${(budget.allocated_direct_minutes / budget.total_lesson_minutes) * 100}%` }}
                className="bg-[#8A2F35]"
                title={`Direct Support: ${budget.allocated_direct_minutes}m`}
              />
              <div
                style={{ width: `${(budget.independent_monitoring_minutes / budget.total_lesson_minutes) * 100}%` }}
                className="bg-[#4F7658]"
                title={`Independent Monitoring: ${budget.independent_monitoring_minutes}m`}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#737373]">
              <span>Whole Class ({budget.whole_class_minutes}m)</span>
              <span>Direct Focus ({budget.allocated_direct_minutes}m)</span>
              <span>Monitoring ({budget.independent_monitoring_minutes}m)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#525252] leading-relaxed pt-1 border-t border-[#D9D3C7]">
            <b>AI Rationale:</b> Path A is scheduled for intensive guided support because diagnostic evidence indicates an underlying prerequisite gap in place-value decomposition. Independent consolidation in Path D prevents instructional bottleneck.
          </p>
        </div>

      </div>

      {/* Visual Classroom Timeline (Section 10) */}
      <ClassroomTimeline
        timeline={plan.timeline}
        totalMinutes={plan.duration_minutes}
      />

      {/* Classroom Learning Landscape (Section 30) */}
      <ClassroomLandscape plan={plan} />

      {/* 4 Differentiated Instructional Paths (Section 11, 13, 14, 18) */}
      <div className="space-y-4">
        <SectionHeader
          label="Temporary Evidence-Based Paths"
          title="Dynamic Instructional Paths"
          rightElement={
            <span className="text-[11px] text-[#737373]">
              All 30 students accounted for • Zero permanent ability labeling
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plan.paths.map(p => (
            <InstructionalPathCard
              key={p.id}
              path={p}
              onUpdateDuration={handleUpdatePathDuration}
              onUpdateAttention={handleUpdatePathAttention}
              onViewStudentDiagnostic={(studentId) => onNavigate('student_gap_analysis', { studentId })}
            />
          ))}
        </div>
      </div>

      {/* Bottom Live Action Callout */}
      <div className="bg-[#17365D] text-[#FCFBF8] border border-[#0F243E] rounded-[4px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-base">
            Classroom Plan Ready for Deployment
          </h3>
          <p className="text-xs text-[#D6E2EF] mt-0.5">
            Launch Live Classroom Mode to monitor time allocations, conduct guided activities, and record exit micro-evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ActionButton
            variant="maroon"
            onClick={() => onNavigate('live_classroom', { planId: plan.id })}
          >
            Start Live Lesson (Screen 13) →
          </ActionButton>
        </div>
      </div>

      {/* End-of-Lesson Review Modal */}
      {showReviewModal && (
        <LessonReviewModal
          planId={plan.id}
          onClose={() => setShowReviewModal(false)}
          onNavigate={onNavigate}
        />
      )}

    </div>
  );
};
