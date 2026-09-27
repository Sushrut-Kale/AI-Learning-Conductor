import React, { useState, useEffect } from 'react';
import { api, TeachAndAdaptOverview } from '../services/api';
import { StudentTrajectoryModal } from './StudentTrajectoryModal';

interface TeachAndAdaptDashboardProps {
  classId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const TeachAndAdaptDashboard: React.FC<TeachAndAdaptDashboardProps> = ({
  classId = 'CLS_G3A',
  onNavigate
}) => {
  const [overview, setOverview] = useState<TeachAndAdaptOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrajectoryStudent, setSelectedTrajectoryStudent] = useState<{ id: string; name: string } | null>(null);
  const [preparingNextLesson, setPreparingNextLesson] = useState(false);
  const [handoffBanner, setHandoffBanner] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, [classId]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getTeachAndAdaptOverview(classId);
      setOverview(data);
    } catch (e) {
      console.error('Failed to load teach & adapt overview', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareNextLesson = async () => {
    setPreparingNextLesson(true);
    try {
      const res = await api.prepareNextLessonHandoff(classId);
      setHandoffBanner(`Closed-Loop Handoff: Next classroom orchestration generated ("${res.lesson_topic}"). Redirecting to Classroom Orchestration...`);
      setTimeout(() => {
        onNavigate('orchestration', { classId, planId: res.new_plan_id });
      }, 1600);
    } catch (e) {
      console.error('Next lesson handoff failed', e);
      onNavigate('orchestration', { classId });
    } finally {
      setPreparingNextLesson(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[#666666]">
        Loading Classroom Teaching & Adaptation intelligence...
      </div>
    );
  }

  const paths = overview.paths_status || [
    { path_id: 'PATH_A', title: 'Path A — Regrouping Foundation', student_count: 6, status: 'In Progress' },
    { path_id: 'PATH_B', title: 'Path B — Word Decoding', student_count: 4, status: 'Completed' },
    { path_id: 'PATH_C', title: 'Path C — Number Comparison', student_count: 3, status: 'In Progress' },
    { path_id: 'PATH_D', title: 'Path D — Independent Consolidation', student_count: 17, status: 'Completed' }
  ];

  const breakdowns = overview.adaptation_summary?.path_response_breakdowns || [
    { path_id: 'PATH_A', title: 'Path A — Regrouping', total_students: 6, progress_observed: 4, partial_response: 1, further_check: 1, recommended_action: 'CONTINUE' as const, summary: '4 demonstrated independent place-value exchange; 1 partial response; 1 further check.' },
    { path_id: 'PATH_B', title: 'Path B — Word Decoding', total_students: 4, progress_observed: 3, partial_response: 0, further_check: 1, recommended_action: 'CONTINUE' as const, summary: '3 decoded multi-syllable cards accurately; 1 continues difficulty.' },
    { path_id: 'PATH_C', title: 'Path C — Number Comparison', total_students: 3, progress_observed: 3, partial_response: 0, further_check: 0, recommended_action: 'CONTINUE' as const, summary: 'All 3 demonstrated tens-place orientation on numeral card challenge.' },
    { path_id: 'PATH_D', title: 'Path D — Independent Consolidation', total_students: 17, progress_observed: 14, partial_response: 0, further_check: 3, recommended_action: 'CONTINUE' as const, summary: '14 finished textbook word problem set accurately; 3 require review.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#252525]">
      
      {/* Header Banner (Section 4) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35] bg-[#F2EDEA] px-2 py-0.5 border border-[#D9C7BE]">
                Continuous Teaching & Adaptation
              </span>
              <span className="text-xs text-[#666666] font-mono">
                Session: {overview.session_date}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#17365D] tracking-tight mt-1">
              Teach & Adapt — {overview.class_name}
            </h1>
            <p className="text-xs text-[#555555] font-sans mt-0.5">
              Current Lesson: <strong className="text-[#17365D]">{overview.lesson_topic}</strong> • Status: <span className="font-mono font-bold text-[#4F7658]">ACTIVE</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('live_teaching', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
              className="px-4 py-2 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] transition-colors border border-[#0F243E]"
            >
              [ Continue Session ]
            </button>
            <button
              onClick={() => onNavigate('intervention_review', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
              className="px-4 py-2 bg-[#FCFBF8] text-[#17365D] border border-[#D9D3C7] text-xs font-medium hover:bg-[#F7F3EA] transition-colors"
            >
              [ Review Evidence ]
            </button>
            <button
              onClick={handlePrepareNextLesson}
              disabled={preparingNextLesson}
              className="px-4 py-2 bg-[#8A2F35] text-white text-xs font-medium hover:bg-[#6D2328] transition-colors border border-[#6D2328]"
            >
              {preparingNextLesson ? 'Generating...' : '[ Prepare Next Lesson ]'}
            </button>
          </div>
        </div>

        {/* Closed Loop Handoff Banner */}
        {handoffBanner && (
          <div className="mt-4 p-3 bg-[#EEF4EF] border border-[#CADBCE] text-xs font-medium text-[#4F7658] flex items-center justify-between">
            <span>✓ {handoffBanner}</span>
            <span className="text-[10px] font-mono uppercase">Redirecting...</span>
          </div>
        )}

        {/* Core Product Principle Notice (Section 1) */}
        <div className="mt-4 p-3.5 bg-[#FAF4EB] border-l-4 border-[#A87932] text-xs text-[#444444] flex items-center justify-between">
          <div>
            <strong className="text-[#17365D]">Core Product Principle: </strong>
            "After I taught this, did the child's evidence change?" — Distinguishing activity completion from demonstrated learning.
          </div>
          <span className="text-[10px] font-mono text-[#8E8B82] uppercase hidden lg:inline">
            Evidence-Driven Adaptive Teaching
          </span>
        </div>

      </div>

      {/* Hero Demonstration Callout: Aarav Sharma (Section 40 & 41) */}
      <div className="bg-[#FAF4EB] border-2 border-[#8A2F35] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#8A2F35] text-white px-2 py-0.5">
                Evaluator Hero Demonstration
              </span>
              <span className="text-xs font-serif font-bold text-[#8A2F35]">
                Primary Learner Case Study
              </span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#17365D] mt-1">
              Aarav Sharma — Closed-Loop Evidence & Adaptation
            </h2>
            <p className="text-xs text-[#555555] font-sans mt-0.5">
              Baseline: <span className="font-bold text-[#8A2F35]">2 / 5 (40%)</span> → Path: <span className="font-semibold text-[#17365D]">Regrouping Foundation</span> → Post-Check: <span className="font-bold text-[#4F7658]">4 / 5 (80%)</span> → Response: <strong className="text-[#4F7658]">SUPPORTED PROGRESS</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('live_teaching', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
              className="px-3.5 py-1.5 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] transition-colors"
            >
              1. Live Teaching Mode →
            </button>
            <button
              onClick={() => onNavigate('intervention_review', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
              className="px-3.5 py-1.5 bg-[#4F7658] text-white text-xs font-medium hover:bg-[#3F5E46] transition-colors"
            >
              2. Review Evidence (Why?) →
            </button>
            <button
              onClick={() => setSelectedTrajectoryStudent({ id: 'ST001', name: 'Aarav Sharma' })}
              className="px-3.5 py-1.5 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#17365D] hover:bg-[#F7F3EA] transition-colors"
            >
              3. View Trajectory Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Section 4 Quick Metric Tiles & Section 33 Workflow Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-4">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
            Evidence Updated
          </div>
          <div className="font-serif text-3xl font-bold text-[#17365D] mt-1">
            5
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">
            Intervention sessions updated
          </div>
        </div>

        <div className="bg-[#EEF4EF] border border-[#CADBCE] p-4">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#4F7658]">
            Demonstrated Progress
          </div>
          <div className="font-serif text-3xl font-bold text-[#4F7658] mt-1">
            3
          </div>
          <div className="text-[11px] text-[#4F7658] mt-0.5">
            Target strategy demonstrated
          </div>
        </div>

        <div className="bg-[#FAF4EB] border border-[#E5D8C1] p-4">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#A87932]">
            Still Emerging
          </div>
          <div className="font-serif text-3xl font-bold text-[#A87932] mt-1">
            1
          </div>
          <div className="text-[11px] text-[#A87932] mt-0.5">
            Partial response observed
          </div>
        </div>

        <div className="bg-[#F2EDEA] border border-[#D9C7BE] p-4">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35]">
            Requires Further Check
          </div>
          <div className="font-serif text-3xl font-bold text-[#8A2F35] mt-1">
            1
          </div>
          <div className="text-[11px] text-[#8A2F35] mt-0.5">
            Unresolved error pattern
          </div>
        </div>

      </div>

      {/* Current Instructional Paths (Section 4) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              Current Instructional Paths
            </h2>
            <p className="text-[11px] text-[#666666]">
              Structured classroom instructional paths functioning as intervention episodes.
            </p>
          </div>
          <span className="text-xs font-mono text-[#666666]">
            Total: 4 Active Paths
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paths.map((p) => (
            <div 
              key={p.path_id} 
              className={`p-4 border flex flex-col justify-between ${
                p.status === 'In Progress' 
                  ? 'bg-[#FCFBF8] border-[#17365D]' 
                  : 'bg-[#F7F3EA] border-[#D9D3C7]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="uppercase text-[#8A2F35]">{p.path_id}</span>
                  <span className={`px-1.5 py-0.2 ${
                    p.status === 'In Progress' 
                      ? 'bg-[#EEF4EF] text-[#4F7658] border border-[#CADBCE]' 
                      : 'bg-[#F1EEE7] text-[#666666] border border-[#D9D3C7]'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="font-serif font-bold text-sm text-[#17365D] mt-1.5">
                  {p.title}
                </div>
                <div className="text-xs text-[#555555] mt-1">
                  <strong>{p.student_count}</strong> students assigned
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EBE6DC] flex items-center justify-between">
                <button
                  onClick={() => onNavigate('live_teaching', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
                  className="text-xs font-medium text-[#17365D] hover:underline"
                >
                  Teach Path →
                </button>
                <button
                  onClick={() => onNavigate('intervention_review', { sessionId: 'INT_ST001_SUB', studentId: 'ST001' })}
                  className="text-xs font-medium text-[#666666] hover:text-[#8A2F35]"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Adaptation View — Response Map (Section 20) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              Classroom Response Map
            </h2>
            <p className="text-[11px] text-[#666666]">
              Classroom-level view of intervention response across all temporary instructional paths.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#8E8B82] uppercase">
            Aggregated Evidence Distribution
          </span>
        </div>

        <div className="space-y-3">
          {breakdowns.map((b) => (
            <div key={b.path_id} className="p-4 bg-[#F7F3EA] border border-[#D9D3C7] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="md:w-1/3">
                <div className="text-[10px] font-mono font-bold uppercase text-[#8A2F35]">
                  {b.path_id}
                </div>
                <div className="font-serif font-bold text-sm text-[#17365D]">
                  {b.title}
                </div>
                <div className="text-xs text-[#666666] mt-0.5">
                  {b.total_students} students
                </div>
              </div>

              {/* Tally Columns */}
              <div className="flex items-center gap-4 text-xs font-sans">
                <div className="px-3 py-1 bg-[#EEF4EF] border border-[#CADBCE] text-[#4F7658]">
                  <strong className="font-mono text-sm">{b.progress_observed}</strong>
                  <span className="block text-[10px]">Progress observed</span>
                </div>
                <div className="px-3 py-1 bg-[#FAF4EB] border border-[#E5D8C1] text-[#A87932]">
                  <strong className="font-mono text-sm">{b.partial_response}</strong>
                  <span className="block text-[10px]">Partial response</span>
                </div>
                <div className="px-3 py-1 bg-[#F2EDEA] border border-[#D9C7BE] text-[#8A2F35]">
                  <strong className="font-mono text-sm">{b.further_check}</strong>
                  <span className="block text-[10px]">Further check</span>
                </div>
              </div>

              {/* Summary note */}
              <div className="md:w-1/3 text-xs text-[#555555] italic border-t md:border-t-0 md:border-l border-[#D9D3C7] pt-2 md:pt-0 md:pl-4">
                "{b.summary}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Adaptation Summary: What Changed? & What Next? (Section 34) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* WHAT CHANGED? */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#4F7658] mb-1">
            Section 34 Summary
          </div>
          <h3 className="font-serif font-bold text-base text-[#17365D] border-b border-[#EBE6DC] pb-2 mb-3">
            WHAT CHANGED?
          </h3>
          <p className="text-xs text-[#666666] mb-3">
            Whole classroom post-intervention demonstration across 30 learners:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#EEF4EF] border border-[#CADBCE]">
              <span className="text-[#4F7658] font-bold">18 students</span>
              <span className="text-[#4F7658]">Evidence of progress demonstrated</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF4EB] border border-[#E5D8C1]">
              <span className="text-[#A87932] font-bold">7 students</span>
              <span className="text-[#A87932]">Partial response (additional guided practice)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F2EDEA] border border-[#D9C7BE]">
              <span className="text-[#8A2F35] font-bold">3 students</span>
              <span className="text-[#8A2F35]">Further evidence required / check prerequisite</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F1EEE7] border border-[#D9D3C7]">
              <span className="text-[#666666] font-bold">2 students</span>
              <span className="text-[#666666]">Not observed during today's session</span>
            </div>
          </div>
        </div>

        {/* WHAT SHOULD HAPPEN NEXT? */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#17365D] mb-1">
              Section 34 Strategy
            </div>
            <h3 className="font-serif font-bold text-base text-[#17365D] border-b border-[#EBE6DC] pb-2 mb-3">
              WHAT SHOULD HAPPEN NEXT?
            </h3>
            <p className="text-xs text-[#666666] mb-3">
              Automated institutional recommendation bridging into next orchestration:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-[#FCFBF8] border border-[#D9D3C7]">
                <strong className="text-[#17365D]">CONTINUE: 3 paths</strong>
                <span className="text-[#555555]">Move toward independent consolidation</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FCFBF8] border border-[#D9D3C7]">
                <strong className="text-[#A87932]">ADJUST: 1 path</strong>
                <span className="text-[#555555]">Introduce peer-paired concrete manipulatives</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FCFBF8] border border-[#D9D3C7]">
                <strong className="text-[#8A2F35]">INVESTIGATE: 0 paths</strong>
                <span className="text-[#555555]">No unresolved divergence detected</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EBE6DC]">
            <button
              onClick={handlePrepareNextLesson}
              disabled={preparingNextLesson}
              className="w-full py-2 bg-[#8A2F35] text-white text-xs font-medium hover:bg-[#6D2328] transition-colors border border-[#6D2328]"
            >
              {preparingNextLesson ? 'Preparing Next Lesson...' : '[ Prepare Next Lesson ] — Closed-Loop Bridge'}
            </button>
          </div>
        </div>

      </div>

      {/* Trajectory Modal */}
      {selectedTrajectoryStudent && (
        <StudentTrajectoryModal
          studentId={selectedTrajectoryStudent.id}
          studentName={selectedTrajectoryStudent.name}
          onClose={() => setSelectedTrajectoryStudent(null)}
          onNavigate={onNavigate}
        />
      )}

    </div>
  );
};
