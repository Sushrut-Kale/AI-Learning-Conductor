import React, { useState, useEffect } from 'react';
import { api, ClassroomDiagnosticOverview } from '../services/api';
import { PageHeader, SectionHeader, ActionButton } from './common/InstitutionalUI';

interface DiagnosticOverviewProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const DiagnosticOverview: React.FC<DiagnosticOverviewProps> = ({ classId, onNavigate }) => {
  const [overview, setOverview] = useState<ClassroomDiagnosticOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, [classId]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getClassroomDiagnosticOverview(classId || 'CLS_G3A');
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Analyzing classroom foundational error patterns...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Page Header */}
      <PageHeader
        breadcrumb="Classroom Learning Map"
        onBreadcrumbClick={() => onNavigate('learning_map', { classId })}
        title="Classroom Diagnostic Overview"
        subtitle={`Grade 3 — Section A • Prerequisite Gap Identification & Evidence Patterns`}
        badge="Phase 2: Diagnose & Decide"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('student_gap_analysis', { studentId: 'ST001' })}
            >
              Analyze Student A (Aarav Sharma) →
            </ActionButton>
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('learning_map', { classId })}
            >
              ← Back to Learning Map
            </ActionButton>
          </div>
        }
      />

      {/* Core Phase 2 Principle Callout */}
      <div className="bg-[#F1EEE7] border-l-4 border-l-[#8A2F35] border border-[#D9D3C7] rounded-[4px] p-4 text-xs text-[#525252] leading-relaxed">
        <p className="font-bold text-[#8A2F35] uppercase tracking-wide text-[10px] mb-1">
          Instructional Decision-Support System • Phase 2 Principles
        </p>
        <p>
          Phase 1 measured <b>what</b> children demonstrated. Phase 2 analyzes the <b>pattern inside the errors</b> to formulate testable hypotheses regarding underlying prerequisite gaps. 
          The platform never assigns permanent labels or disability diagnoses, and distinguishes observed facts from AI hypotheses.
        </p>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#666666] font-semibold">Assessed Baseline</p>
          <p className="font-serif font-bold text-2xl text-[#17365D] mt-1">{overview.students_reviewed}</p>
          <p className="text-[10px] text-[#737373] mt-0.5">Students with completed evidence</p>
        </div>

        <div className="bg-[#FCFBF8] border border-[#B8B0A2] rounded-[4px] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#8A2F35] font-semibold">Requiring Diagnostic Review</p>
          <p className="font-serif font-bold text-2xl text-[#8A2F35] mt-1">{overview.students_requiring_review}</p>
          <p className="text-[10px] text-[#737373] mt-0.5">Showing specific non-random error patterns</p>
        </div>

        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#17365D] font-semibold">Clustered Patterns Detected</p>
          <p className="font-serif font-bold text-2xl text-[#17365D] mt-1">{overview.patterns.length}</p>
          <p className="text-[10px] text-[#737373] mt-0.5">Across foundational literacy & numeracy</p>
        </div>
      </div>

      {/* Prevalent Classroom Patterns (Section 19) */}
      <div className="space-y-4">
        <SectionHeader 
          label="Classroom Evidence Clustering"
          title="Observed Classroom Learning Patterns" 
          rightElement={
            <span className="text-[10px] font-sans text-[#666666] italic">
              Clustered by shared task conditions
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-4">
          {overview.patterns.map((pat, idx) => (
            <div 
              key={pat.pattern_id}
              className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-[#D9D3C7]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A2F35]">
                    Pattern {idx + 1} • {pat.domain === 'numeracy' ? 'Foundational Numeracy' : 'Foundational Literacy'}
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#17365D]">
                    {pat.skill_title}: {pat.pattern_summary}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#FAF4EB] text-[#8F6627] border border-[#E5D8C1] rounded-[3px] self-start sm:self-auto">
                  {pat.student_count} Students Exhibit Similar Pattern
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#252525]">Potential Shared Prerequisite Gap:</p>
                  <p className="p-2.5 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[3px] text-[#525252] font-mono text-[11px]">
                    {pat.potential_shared_prerequisite}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#252525]">Recommended Diagnostic Focus:</p>
                  <p className="p-2.5 bg-[#EDF3EE] border border-[#C6D8CA] rounded-[3px] text-[#3B5E43] font-medium">
                    {pat.recommended_diagnostic_focus}
                  </p>
                </div>
              </div>

              {/* Students in Pattern */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-[#666666] mb-1.5 uppercase tracking-wide">
                  Students Showing This Pattern ({pat.students.length}):
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {pat.students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onNavigate('student_gap_analysis', { studentId: s.id, skillId: pat.skill_id })}
                      className="px-2.5 py-1 text-xs font-medium bg-[#FCFBF8] border border-[#D9D3C7] hover:border-[#17365D] hover:bg-[#F1EEE7] rounded-[3px] text-[#17365D] flex items-center gap-1 transition-colors"
                      title="Open individual student gap analysis"
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] text-[#737373]">#{s.roll_number}</span>
                      <span className="text-[10px] text-[#8A2F35]">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 3 Boundary Explanation (Section 20) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 text-xs text-[#525252] space-y-2">
        <p className="font-bold text-[#17365D] uppercase tracking-wide text-[10px]">
          Classroom Orchestration Boundary (Phase 2 vs Phase 3)
        </p>
        <p className="leading-relaxed">
          While Phase 2 identifies clusters of learners with similar prerequisite error patterns, 
          <b> the platform intentionally does not automatically generate teaching groups or differentiated worksheets at this stage</b>. 
          Dynamic grouping, time allocation, and classroom orchestration belong strictly to <b>Phase 3: Orchestrate Classroom</b>.
        </p>
      </div>

    </div>
  );
};
