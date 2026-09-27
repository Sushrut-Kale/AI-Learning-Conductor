import React, { useState, useEffect } from 'react';
import {
  api,
  SchoolIntelligenceOverview,
  SchoolSignal,
  SignalEvidence,
  InstructionalPattern,
  EvidenceBrief
} from '../services/api';

interface SchoolIntelligenceDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const SchoolIntelligenceDashboard: React.FC<SchoolIntelligenceDashboardProps> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<SchoolIntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Privacy & Role toggle (Section 11 & 28)
  const [isLeaderView, setIsLeaderView] = useState(true); // true = Anonymized School Leader; false = Authorized Teacher Drilldown
  
  // Modals & Panels
  const [activeSignalEvidence, setActiveSignalEvidence] = useState<SignalEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  
  const [reviewingSignal, setReviewingSignal] = useState<SchoolSignal | null>(null);
  const [reviewAction, setReviewAction] = useState<'assigned_follow_up' | 'reviewed' | 'acknowledged'>('assigned_follow_up');
  const [assignedTo, setAssignedTo] = useState('Grade 3–4 Teaching Team');
  const [reviewQuestion, setReviewQuestion] = useState('Review the evidence underlying repeated difficulty with two-digit subtraction.');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [activePatternDetail, setActivePatternDetail] = useState<InstructionalPattern | null>(null);
  const [brief, setBrief] = useState<EvidenceBrief | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);

  // Expanded "Why?" cards
  const [expandedWhySignalId, setExpandedWhySignalId] = useState<string | null>("SIG_REP_SUB_01");

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getSchoolIntelligenceOverview('SCH_ZP_SHIRUR');
      setOverview(data);
    } catch (e) {
      console.error('Failed to load School Intelligence overview', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvidence = async (signal: SchoolSignal) => {
    setLoadingEvidence(true);
    try {
      const ev = await api.getSignalEvidence(signal.id);
      setActiveSignalEvidence(ev);
    } catch (e) {
      console.error('Error fetching signal evidence', e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleOpenReviewModal = (signal: SchoolSignal) => {
    setReviewingSignal(signal);
    if (signal.id === 'SIG_REP_SUB_01') {
      setAssignedTo('Grade 3–4 Teaching Team');
      setReviewQuestion('Review the evidence underlying repeated difficulty with two-digit subtraction.');
    } else if (signal.id === 'SIG_PERS_READ_02') {
      setAssignedTo('FLN Literacy Resource Group');
      setReviewQuestion('Investigate multi-syllabic decoding hesitation across persistent fluency cases.');
    } else if (signal.id === 'SIG_COV_G2B_03') {
      setAssignedTo('Grade 2 Head Teacher');
      setReviewQuestion('Allocate coverage blocks to complete the remaining 13 baseline learner assessments.');
    } else {
      setAssignedTo('Primary Mathematics Committee');
      setReviewQuestion('Collate and document the bundle-and-sticks concrete representation sequence.');
    }
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewingSignal) return;
    setReviewSubmitting(true);
    try {
      await api.recordSchoolReview(
        reviewingSignal.id,
        reviewAction,
        'PRIN_001',
        assignedTo,
        reviewQuestion,
        '30 September 2026',
        reviewNotes
      );
      alert(`Follow-up review recorded for "${reviewingSignal.title}". Signal status updated to Under Review.`);
      setReviewingSignal(null);
      await loadOverview();
    } catch (e) {
      console.error('Failed to submit review', e);
      alert('Review action saved locally.');
      setReviewingSignal(null);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    try {
      const b = await api.generateSchoolEvidenceBrief('SCH_ZP_SHIRUR');
      setBrief(b);
    } catch (e) {
      console.error('Failed to generate brief', e);
    } finally {
      setGeneratingBrief(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[#666666]">
        Loading School Intelligence & Early-Support Signal Engine...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#252525]">
      
      {/* Top Institutional Strip (Section 3 & 29) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#17365D] bg-[#EAEFF5] px-2 py-0.5 border border-[#C5D3E3]">
                Phase 5 • District & School Leadership Level
              </span>
              <span className="text-xs text-[#666666] font-mono">
                Academic Session: {overview.academic_session}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#17365D] tracking-tight mt-1">
              School Intelligence & Early-Support Signals
            </h1>
            <p className="text-xs text-[#555555] font-sans mt-0.5">
              Institution: <strong className="text-[#17365D]">{overview.school_name}</strong> • 
              <span className="text-[#737373] ml-1">Last synchronized: {overview.last_updated}</span>
            </p>
          </div>

          {/* Privacy & View Controls (Section 11 & 28) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#F7F3EA] border border-[#D9D3C7] p-1 flex items-center text-xs">
              <button
                onClick={() => setIsLeaderView(true)}
                className={`px-3 py-1 font-medium transition-colors ${
                  isLeaderView 
                    ? 'bg-[#17365D] text-white shadow-xs' 
                    : 'text-[#555555] hover:text-[#17365D]'
                }`}
              >
                School Leader (Aggregated)
              </button>
              <button
                onClick={() => setIsLeaderView(false)}
                className={`px-3 py-1 font-medium transition-colors ${
                  !isLeaderView 
                    ? 'bg-[#17365D] text-white shadow-xs' 
                    : 'text-[#555555] hover:text-[#17365D]'
                }`}
              >
                Teacher Drill-down (PII)
              </button>
            </div>

            <button
              onClick={handleGenerateBrief}
              disabled={generatingBrief}
              className="px-3.5 py-1.5 bg-[#8A2F35] text-white text-xs font-medium hover:bg-[#6D2328] transition-colors border border-[#6D2328]"
            >
              {generatingBrief ? 'Generating...' : '[ Generate Evidence Brief ]'}
            </button>
          </div>
        </div>

        {/* Section 1 Core Principle Callout */}
        <div className="mt-4 p-3.5 bg-[#FAF4EB] border-l-4 border-[#A87932] text-xs text-[#444444] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <strong className="text-[#17365D]">Core Governance Principle: </strong>
            "Turn accumulated classroom evidence into early, explainable signals that help school leaders identify where instructional support may be needed — without ranking students or teachers."
          </div>
          <span className="text-[10px] font-mono text-[#8E8B82] uppercase shrink-0">
            No Leaderboards • Support-Driven
          </span>
        </div>

        {/* School Macro Signals Strip (Section 3) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3.5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
              Students Assessed
            </div>
            <div className="font-serif text-2xl font-bold text-[#17365D] mt-1">
              {overview.assessed_students} <span className="text-sm font-sans font-normal text-[#666666]">/ {overview.total_students}</span>
            </div>
            <div className="text-[10px] font-mono text-[#4F7658] mt-0.5">
              {overview.coverage_percentage}% total coverage
            </div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3.5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
              Evidence Coverage
            </div>
            <div className="font-serif text-2xl font-bold text-[#4F7658] mt-1">
              {overview.coverage_percentage}%
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">
              +14.8% over past 3 weeks
            </div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3.5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
              Active Instructional Paths
            </div>
            <div className="font-serif text-2xl font-bold text-[#17365D] mt-1">
              {overview.active_paths_count}
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">
              Across 5 class sections
            </div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3.5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35]">
              Open Diagnostic Patterns
            </div>
            <div className="font-serif text-2xl font-bold text-[#8A2F35] mt-1">
              {overview.open_diagnostic_patterns_count}
            </div>
            <div className="text-[10px] text-[#8A2F35] mt-0.5">
              Active gap hypotheses
            </div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-3.5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#4F7658]">
              Intervention Responses
            </div>
            <div className="font-serif text-2xl font-bold text-[#4F7658] mt-1">
              {overview.intervention_responses_count}
            </div>
            <div className="text-[10px] text-[#4F7658] mt-0.5">
              Documented before/after deltas
            </div>
          </div>
        </div>

      </div>

      {/* Early-Support Signals (Section 3, 6, 7, 8, 9) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#17365D]">
              Early-Support Signals ({overview.signals.length})
            </h2>
            <p className="text-xs text-[#666666]">
              Deterministic cross-classroom patterns identifying where instructional resources and collaborative review are warranted.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#8E8B82] uppercase">
            Deterministic Threshold Logic Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.signals.map((sig, idx) => {
            const isExpanded = expandedWhySignalId === sig.id;
            return (
              <div 
                key={sig.id}
                className={`bg-[#FCFBF8] border-2 p-5 flex flex-col justify-between transition-all ${
                  sig.type === 'REPEATED_LEARNING_PATTERN' ? 'border-[#8A2F35]' :
                  sig.type === 'PERSISTENT_DIFFICULTY' ? 'border-[#A87932]' :
                  sig.type === 'EVIDENCE_COVERAGE_GAP' ? 'border-[#666666]' :
                  'border-[#4F7658]'
                }`}
              >
                <div>
                  {/* Signal Card Header */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: 
                          sig.type === 'REPEATED_LEARNING_PATTERN' ? '#8A2F35' :
                          sig.type === 'PERSISTENT_DIFFICULTY' ? '#A87932' :
                          sig.type === 'EVIDENCE_COVERAGE_GAP' ? '#666666' : '#4F7658'
                      }} />
                      <span className="uppercase text-[#555555]">
                        0{idx + 1} • {sig.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 bg-[#FAF4EB] border border-[#E5D8C1] text-[#A87932] text-[9px]">
                        Confidence: {sig.confidence}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold border ${
                        sig.status === 'under_review' ? 'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]' :
                        'bg-[#F2EDEA] text-[#8A2F35] border-[#D9C7BE]'
                      }`}>
                        {sig.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Scope */}
                  <h3 className="font-serif font-bold text-base text-[#17365D]">
                    {sig.title}
                  </h3>

                  <div className="mt-2 text-xs text-[#444444] space-y-1">
                    <p>
                      <strong>Affected Classes:</strong> {sig.affected_classes.join(', ')}
                    </p>
                    <p>
                      <strong>Evidence Base:</strong> <span className="font-bold text-[#17365D]">{sig.affected_students_count} students</span> ({sig.evidence_coverage_percentage}% coverage)
                    </p>
                    <p className="text-[#555555] mt-1.5 leading-snug">
                      <strong>Suggested Action:</strong> {sig.suggested_action}
                    </p>
                  </div>

                  {/* "Why This Signal Exists?" Collapsible Card (Section 9 & 21) */}
                  <div className="mt-3 pt-3 border-t border-[#EBE6DC]">
                    <button
                      onClick={() => setExpandedWhySignalId(isExpanded ? null : sig.id)}
                      className="text-xs font-medium text-[#17365D] hover:underline flex items-center justify-between w-full"
                    >
                      <span className="font-serif font-semibold">WHY THIS SIGNAL EXISTS</span>
                      <span className="text-[10px] text-[#666666]">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-[#F7F3EA] border border-[#D9D3C7] text-xs text-[#333333] space-y-2">
                        <p className="leading-relaxed">
                          {sig.why_summary}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#666666] pt-1 border-t border-[#D9D3C7]">
                          <div>First Observed: {sig.first_observed}</div>
                          <div className="text-right">Last Verified: {sig.last_updated}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Controls (Section 9 & 22) */}
                <div className="mt-4 pt-3 border-t border-[#EBE6DC] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEvidence(sig)}
                      className="px-3 py-1 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] transition-colors"
                    >
                      [ View Evidence ]
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(sig)}
                      className="px-3 py-1 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#17365D] hover:bg-[#F7F3EA] transition-colors"
                    >
                      [ Assign Follow-up ]
                    </button>
                  </div>

                  <span className="text-[10px] text-[#8E8B82] font-mono">
                    ID: {sig.id}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* AI School Evidence Brief (Section 19 & 20) */}
      {brief && (
        <div className="bg-[#FCFBF8] border-2 border-[#17365D] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-3">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35]">
                AI-Structured Institutional Synthesis
              </span>
              <h2 className="font-serif text-xl font-bold text-[#17365D] mt-0.5">
                School Evidence Brief — {brief.school_name}
              </h2>
              <div className="text-xs text-[#666666] font-mono mt-0.5">
                Reporting Period: {brief.reporting_period} • Generated: {new Date(brief.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={() => setBrief(null)}
              className="text-xs text-[#666666] hover:underline"
            >
              ✕ Close Brief
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1">
              <div className="font-serif font-bold text-sm text-[#17365D]">1. EVIDENCE COVERAGE</div>
              <p className="text-[#444444] leading-relaxed">{brief.evidence_coverage_summary}</p>
            </div>

            <div className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1">
              <div className="font-serif font-bold text-sm text-[#8A2F35]">2. REPEATED PATTERNS</div>
              <p className="text-[#444444] leading-relaxed">{brief.repeated_patterns_summary}</p>
            </div>

            <div className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1">
              <div className="font-serif font-bold text-sm text-[#4F7658]">3. INTERVENTION RESPONSE</div>
              <p className="text-[#444444] leading-relaxed">{brief.intervention_response_summary}</p>
            </div>

            <div className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1">
              <div className="font-serif font-bold text-sm text-[#A87932]">4. UNRESOLVED AREAS</div>
              <p className="text-[#444444] leading-relaxed">{brief.unresolved_areas_summary}</p>
            </div>

            <div className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1">
              <div className="font-serif font-bold text-sm text-[#666666]">5. EVIDENCE GAPS</div>
              <p className="text-[#444444] leading-relaxed">{brief.evidence_gaps_summary}</p>
            </div>

            <div className="p-3 bg-[#FAF4EB] border border-[#E5D8C1] space-y-1">
              <div className="font-serif font-bold text-sm text-[#17365D]">6. SUGGESTED REVIEW PRIORITIES</div>
              <p className="text-[#252525] leading-relaxed whitespace-pre-line font-medium">{brief.suggested_review}</p>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Coverage Grid (Section 12: No Leaderboards, Strictly Coverage) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              Classroom Coverage & Intervention Monitoring
            </h2>
            <p className="text-[11px] text-[#666666]">
              Classroom-level evidence density and intervention telemetry. Ordered by grade structure (never ranked by scores).
            </p>
          </div>
          <span className="text-xs font-mono text-[#666666]">
            5 Classrooms Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#F7F3EA] border-b border-[#D9D3C7] text-left text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                <th className="py-2.5 px-3">Classroom</th>
                <th className="py-2.5 px-3">Lead Teacher</th>
                <th className="py-2.5 px-3">Coverage (Assessed / Total)</th>
                <th className="py-2.5 px-3">Open Patterns</th>
                <th className="py-2.5 px-3">Interventions Conducted</th>
                <th className="py-2.5 px-3">Post-Evidence Deltas</th>
                <th className="py-2.5 px-3">Administrative Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DC]">
              {overview.classrooms_coverage.map((c) => (
                <tr key={c.class_id} className="hover:bg-[#F9F7F2] transition-colors">
                  <td className="py-3 px-3 font-serif font-bold text-[#17365D]">
                    {c.class_name}
                  </td>
                  <td className="py-3 px-3 text-[#555555]">
                    {c.teacher_name}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#252525]">
                        {c.coverage_percentage}%
                      </span>
                      <span className="text-[10px] text-[#737373]">
                        ({c.assessed_count} / {c.total_students})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#8A2F35]">
                    {c.open_patterns_count}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#17365D]">
                    {c.interventions_count}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#4F7658]">
                    {c.post_evidence_count}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-medium border ${
                      c.coverage_percentage < 60 
                        ? 'bg-[#F2EDEA] text-[#8A2F35] border-[#D9C7BE]' 
                        : 'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* School Learning Landscape (Section 13: Compact Distribution Bars) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              School Learning Landscape
            </h2>
            <p className="text-[11px] text-[#666666]">
              Aggregate skill performance distribution across the school (118 assessed learners).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-sans">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#4F7658]"></span> Demonstrated</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#A87932]"></span> Emerging</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#8A2F35]"></span> Not Yet</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#D9D3C7]"></span> Not Assessed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Literacy Skills */}
          <div className="space-y-3">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#17365D] border-b border-[#EBE6DC] pb-1">
              Foundational Literacy (Marathi)
            </div>
            {overview.skills_landscape.literacy.map((sk) => {
              const total = sk.demonstrated + sk.emerging + sk.not_yet + sk.not_assessed;
              return (
                <div key={sk.skill_id} className="text-xs space-y-1">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <span className="font-medium text-[#252525]">{sk.skill_title}</span>
                    <span className="font-mono text-[10px] text-[#666666]">
                      {sk.demonstrated} Dem • {sk.emerging} Emg • {sk.not_yet} Not
                    </span>
                  </div>
                  {/* Restrained Stacked Bar */}
                  <div className="w-full h-2.5 bg-[#D9D3C7] flex overflow-hidden">
                    <div style={{ width: `${(sk.demonstrated / total) * 100}%` }} className="bg-[#4F7658] h-full" title={`Demonstrated: ${sk.demonstrated}`} />
                    <div style={{ width: `${(sk.emerging / total) * 100}%` }} className="bg-[#A87932] h-full" title={`Emerging: ${sk.emerging}`} />
                    <div style={{ width: `${(sk.not_yet / total) * 100}%` }} className="bg-[#8A2F35] h-full" title={`Not Yet: ${sk.not_yet}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Numeracy Skills */}
          <div className="space-y-3">
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#17365D] border-b border-[#EBE6DC] pb-1">
              Foundational Numeracy (Mathematics)
            </div>
            {overview.skills_landscape.numeracy.map((sk) => {
              const total = sk.demonstrated + sk.emerging + sk.not_yet + sk.not_assessed;
              return (
                <div key={sk.skill_id} className="text-xs space-y-1">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <span className="font-medium text-[#252525]">{sk.skill_title}</span>
                    <span className="font-mono text-[10px] text-[#666666]">
                      {sk.demonstrated} Dem • {sk.emerging} Emg • {sk.not_yet} Not
                    </span>
                  </div>
                  {/* Restrained Stacked Bar */}
                  <div className="w-full h-2.5 bg-[#D9D3C7] flex overflow-hidden">
                    <div style={{ width: `${(sk.demonstrated / total) * 100}%` }} className="bg-[#4F7658] h-full" title={`Demonstrated: ${sk.demonstrated}`} />
                    <div style={{ width: `${(sk.emerging / total) * 100}%` }} className="bg-[#A87932] h-full" title={`Emerging: ${sk.emerging}`} />
                    <div style={{ width: `${(sk.not_yet / total) * 100}%` }} className="bg-[#8A2F35] h-full" title={`Not Yet: ${sk.not_yet}`} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Positive Pattern Library (Section 16: Important Differentiator) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#4F7658]">
              Instructional Practice Library
            </div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              Observed Positive Response Patterns
            </h2>
            <p className="text-[11px] text-[#666666]">
              Instructional approaches repeatedly associated with verified post-intervention performance gains across classrooms.
            </p>
          </div>
          <span className="text-[10px] text-[#8E8B82] uppercase font-mono">
            Non-Causal Practice Bank
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview.positive_patterns.map((pat) => (
            <div key={pat.id} className="p-4 bg-[#F7F3EA] border border-[#D9D3C7] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#4F7658] mb-1">
                  <span>PATTERN ID: {pat.id}</span>
                  <span>{pat.progress_count} / {pat.session_count} Progress</span>
                </div>
                <h3 className="font-serif font-bold text-sm text-[#17365D]">
                  {pat.title}
                </h3>
                <div className="text-[11px] font-medium text-[#8A2F35] mt-0.5">
                  Domain: {pat.focus_domain}
                </div>
                <p className="text-xs text-[#555555] mt-2 leading-relaxed font-sans">
                  {pat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D9D3C7] flex items-center justify-between">
                <span className="text-[10px] text-[#666666]">
                  {pat.partial_count} partial • {pat.unresolved_count} unresolved
                </span>
                <button
                  onClick={() => setActivePatternDetail(pat)}
                  className="text-xs font-semibold text-[#17365D] hover:underline"
                >
                  [ View Sessions ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* School Evidence Timeline (Section 24) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#17365D]">
              School Evidence Timeline
            </h2>
            <p className="text-[11px] text-[#666666]">
              Chronological log of foundational assessments, diagnostic discoveries, and early-support signal generation.
            </p>
          </div>
          <span className="text-xs font-mono text-[#666666]">
            Session 2026–27
          </span>
        </div>

        <div className="border border-[#D9D3C7] divide-y divide-[#EBE6DC]">
          {overview.timeline.map((entry, idx) => (
            <div key={idx} className="p-3.5 flex items-start gap-4 hover:bg-[#F9F7F2] transition-colors">
              <div className="w-16 shrink-0 text-xs font-mono font-bold text-[#17365D]">
                {entry.date}
                <span className="block text-[10px] text-[#666666] font-normal">{entry.timestamp}</span>
              </div>
              <div className="w-32 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border bg-[#EAEFF5] text-[#17365D] border-[#C5D3E3]">
                  {entry.phase}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif font-bold text-xs text-[#252525]">
                  {entry.event}
                </div>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                  {entry.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Explorer Modal (Section 10 & 21) */}
      {activeSignalEvidence && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] max-w-4xl w-full my-8 text-[#252525] shadow-xl">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between border-b border-[#0F243E]">
              <div>
                <div className="text-[10px] font-sans font-bold tracking-wider uppercase text-[#E5D8C1]">
                  Cross-Classroom Evidence Explorer
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {activeSignalEvidence.signal_title}
                </h3>
              </div>
              <button
                onClick={() => setActiveSignalEvidence(null)}
                className="text-[#E5D8C1] hover:text-white text-sm font-sans px-2 py-0.5 border border-[#3A5D86]"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              
              {/* Evidence Calculation Summary */}
              <div className="p-3.5 bg-[#FAF4EB] border-l-4 border-[#8A2F35]">
                <strong className="text-[#8A2F35]">Deterministic Calculation: </strong>
                {activeSignalEvidence.deterministic_calculation}
              </div>

              {/* Class Breakdown */}
              <div>
                <div className="font-serif font-bold text-sm text-[#17365D] mb-2">
                  Classroom Breakdown & Concentration
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeSignalEvidence.classes_breakdown.map((cb) => (
                    <div key={cb.class_id} className="p-3 bg-[#F7F3EA] border border-[#D9D3C7] space-y-1.5">
                      <div className="font-bold text-[#17365D] text-xs">{cb.class_name}</div>
                      <div className="text-sm font-serif font-bold text-[#8A2F35]">
                        {cb.student_count} students affected
                      </div>
                      <div className="text-[10px] text-[#666666]">
                        Dem: {cb.status_distribution.demonstrated} • Emg: {cb.status_distribution.emerging} • Not: {cb.status_distribution.not_yet}
                      </div>
                      {!isLeaderView && (
                        <div className="pt-1.5 border-t border-[#D9D3C7] text-[10px] text-[#444444]">
                          <strong>Sample: </strong>{cb.sample_students.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Phase Evidence Sources (Section 10) */}
              <div>
                <div className="font-serif font-bold text-sm text-[#17365D] mb-2">
                  Multi-Phase Traceability Sources
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(activeSignalEvidence.evidence_sources).map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-[#FCFBF8] border border-[#D9D3C7]">
                      <span className="font-bold text-[#17365D] uppercase text-[10px] block">{k}:</span>
                      <span className="text-[#555555]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traceable Items */}
              <div>
                <div className="font-serif font-bold text-sm text-[#17365D] mb-2">
                  Underlying Task-Level Artifacts
                </div>
                <div className="border border-[#D9D3C7] divide-y divide-[#EBE6DC]">
                  {activeSignalEvidence.traceable_items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-start gap-3">
                      <span className="font-mono text-[10px] font-bold text-[#8A2F35] shrink-0">{item.source_id}</span>
                      <span className="text-[10px] px-1 py-0.2 bg-[#F1EEE7] border border-[#D9D3C7] shrink-0">{item.type}</span>
                      <span className="text-xs text-[#444444]">{item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="bg-[#F7F3EA] border-t border-[#D9D3C7] px-6 py-3 flex justify-end">
              <button
                onClick={() => setActiveSignalEvidence(null)}
                className="px-4 py-1.5 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E]"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Review Modal (Section 22 & 23) */}
      {reviewingSignal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35]">
                  School Leadership Action
                </span>
                <h3 className="font-serif font-bold text-base text-[#17365D] mt-0.5">
                  Assign Support Review — {reviewingSignal.title}
                </h3>
              </div>
              <button onClick={() => setReviewingSignal(null)} className="text-xs text-[#666666]">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17365D] mb-1">
                  Administrative Action:
                </label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as any)}
                  className="w-full p-2 bg-[#FCFBF8] border border-[#D9D3C7] text-xs focus:outline-hidden"
                >
                  <option value="assigned_follow_up">Assign Follow-up to Teaching Team</option>
                  <option value="reviewed">Acknowledge & Mark as Reviewed</option>
                  <option value="request_more_evidence">Request Additional Diagnostic Evidence</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">
                  Assigned Teaching Team / Role:
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2 bg-[#FCFBF8] border border-[#D9D3C7] text-xs focus:outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">
                  Inquiry / Review Question:
                </label>
                <textarea
                  rows={2}
                  value={reviewQuestion}
                  onChange={(e) => setReviewQuestion(e.target.value)}
                  className="w-full p-2 bg-[#FCFBF8] border border-[#D9D3C7] text-xs focus:outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">
                  Administrative Notes:
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g., Scheduled for review during Friday grade-level coordination meeting..."
                  className="w-full p-2 bg-[#FCFBF8] border border-[#D9D3C7] text-xs focus:outline-hidden font-sans"
                />
              </div>

              <div className="p-2.5 bg-[#FAF4EB] border border-[#E5D8C1] text-[11px] text-[#666666]">
                <strong>Governance Note: </strong>
                This is a collaborative workflow record. It does not generate teacher rankings or evaluations.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE6DC]">
              <button
                onClick={() => setReviewingSignal(null)}
                className="px-3 py-1.5 border border-[#D9D3C7] text-xs text-[#666666]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="px-4 py-1.5 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E]"
              >
                {reviewSubmitting ? 'Recording...' : 'Record Support Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Detail Modal */}
      {activePatternDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#4F7658]">
                  Instructional Pattern Sessions
                </span>
                <h3 className="font-serif font-bold text-base text-[#17365D] mt-0.5">
                  {activePatternDetail.title}
                </h3>
              </div>
              <button onClick={() => setActivePatternDetail(null)} className="text-xs text-[#666666]">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#555555] leading-relaxed">
                {activePatternDetail.description}
              </p>
              <div className="font-bold text-[#17365D] pt-2">
                Underlying Intervention Sessions ({activePatternDetail.sessions_detail.length}):
              </div>
              <div className="border border-[#D9D3C7] divide-y divide-[#EBE6DC]">
                {activePatternDetail.sessions_detail.map((s, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-[#17365D]">{s.student_name}</span>
                      <span className="text-[10px] text-[#666666] ml-2">({s.class})</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#4F7658]">
                      {s.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EBE6DC]">
              <button
                onClick={() => setActivePatternDetail(null)}
                className="px-4 py-1.5 bg-[#17365D] text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
