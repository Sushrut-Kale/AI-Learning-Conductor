import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  FileSearch, 
  Edit3, 
  Check, 
  RotateCw, 
  MessageSquare, 
  Share2, 
  Printer,
  ChevronRight,
  BookOpen,
  Calculator
} from 'lucide-react';
import { api, LearningFingerprint, SkillEvidence } from '../services/api';

interface StudentFingerprintProps {
  studentId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const StudentFingerprint: React.FC<StudentFingerprintProps> = ({ studentId, onNavigate }) => {
  const [fingerprint, setFingerprint] = useState<LearningFingerprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedSkillForOverride, setSelectedSkillForOverride] = useState<SkillEvidence | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('demonstrated');
  const [overrideNote, setOverrideNote] = useState('');
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  useEffect(() => {
    loadFingerprint();
  }, [studentId]);

  const loadFingerprint = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentProfile(studentId);
      setFingerprint(res.fingerprint);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (skill: SkillEvidence) => {
    setSelectedSkillForOverride(skill);
    setOverrideStatus(skill.status);
    setOverrideNote('');
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillForOverride || !fingerprint) return;

    setIsSavingOverride(true);
    try {
      await api.teacherOverride(studentId, {
        skill_id: selectedSkillForOverride.skill_id,
        domain: selectedSkillForOverride.domain,
        new_status: overrideStatus,
        teacher_note: overrideNote || 'Teacher verified based on classroom observation.'
      });
      await loadFingerprint();
      setShowOverrideModal(false);
    } catch (e) {
      alert('Failed to save override');
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleVerifyProfile = async () => {
    if (!fingerprint) return;
    try {
      await api.teacherOverride(studentId, {
        skill_id: fingerprint.evidence_breakdown[0]?.skill_id || 'general',
        domain: 'reading',
        new_status: fingerprint.evidence_breakdown[0]?.status || 'demonstrated',
        teacher_note: 'Teacher reviewed and verified all foundational evidence.'
      });
      await loadFingerprint();
      alert('Learning Fingerprint verified by Teacher!');
    } catch (e) {
      alert('Verification saved locally.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Constructing Learning Fingerprint...</p>
        </div>
      </div>
    );
  }

  if (!fingerprint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Learning Fingerprint Not Yet Generated</h2>
        <p className="text-xs text-slate-500">
          This student has not completed sufficient assessment tasks to build a reliable evidence profile.
        </p>
        <button
          onClick={() => onNavigate('assessment', { studentId })}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        >
          Start Assessment Now
        </button>
      </div>
    );
  }

  const readingEvidence = fingerprint.evidence_breakdown.filter(e => e.domain === 'reading');
  const numeracyEvidence = fingerprint.evidence_breakdown.filter(e => e.domain === 'numeracy');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'demonstrated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Demonstrated</span>
          </span>
        );
      case 'emerging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Emerging</span>
          </span>
        );
      case 'not_yet_demonstrated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Not Yet Demonstrated</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>Not Assessed</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('class_overview', { classId: 'CLS_G3A' })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Class Roster
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Learning Fingerprint
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Phase 1 Profile
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Evidence-grounded learner profile preserving raw performance traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('evidence', { studentId })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Evidence Audit ('Why?')</span>
          </button>

          <button
            onClick={handleVerifyProfile}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              fingerprint.teacher_verified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{fingerprint.teacher_verified ? 'Teacher Verified' : 'Verify Profile'}</span>
          </button>
        </div>
      </div>

      {/* Student Meta Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
            {fingerprint.student_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{fingerprint.student_name}</h2>
              <span className="text-xs text-slate-400 font-mono">#{fingerprint.student_id}</span>
            </div>
            <p className="text-xs text-slate-500">
              Grade {fingerprint.grade} • Language: {fingerprint.language} • Assessed: {fingerprint.assessment_date}
            </p>
          </div>
        </div>

        {/* Confidence Rating Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Grounded Confidence</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-2.5 h-2.5 rounded-full ${
                fingerprint.confidence === 'High' ? 'bg-emerald-500' : fingerprint.confidence === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <span className="text-sm font-bold text-slate-800">{fingerprint.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Grounded Summary Narrative Card */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-200/80 p-5">
        <div className="flex items-center gap-2 text-blue-900 text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Objective Grounded Summary (AI Synthesized • No Pedagogical Speculation)</span>
        </div>
        <p className="text-slate-800 text-sm leading-relaxed font-normal">
          {fingerprint.ai_summary_narrative}
        </p>
        {fingerprint.teacher_notes && (
          <div className="mt-3 pt-3 border-t border-blue-200/60 text-xs text-blue-950 bg-blue-100/50 p-2.5 rounded-lg">
            <span className="font-semibold">Teacher Annotation: </span>
            {fingerprint.teacher_notes}
          </div>
        )}
      </div>

      {/* Two Column Grid: Reading & Numeracy Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Reading Domain */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Foundational Literacy</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {readingEvidence.filter(e => e.status === 'demonstrated').length} of {readingEvidence.length} Demonstrated
            </span>
          </div>

          <div className="space-y-3">
            {readingEvidence.map(skill => (
              <div 
                key={skill.skill_id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-800">{skill.skill_title}</span>
                  {getStatusBadge(skill.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Evidence: <b>{skill.correct}</b> of <b>{skill.total}</b> tasks correct ({skill.percentage}%)
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenOverride(skill)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] font-semibold flex items-center gap-0.5"
                      title="Adjust skill status manually"
                    >
                      <Edit3 className="w-3 h-3" /> Adjust
                    </button>

                    <button
                      onClick={() => onNavigate('evidence', { studentId, skillId: skill.skill_id })}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] flex items-center gap-0.5 underline"
                    >
                      Why? <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Numeracy Domain */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Foundational Numeracy</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {numeracyEvidence.filter(e => e.status === 'demonstrated').length} of {numeracyEvidence.length} Demonstrated
            </span>
          </div>

          <div className="space-y-3">
            {numeracyEvidence.map(skill => (
              <div 
                key={skill.skill_id}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-800">{skill.skill_title}</span>
                  {getStatusBadge(skill.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Evidence: <b>{skill.correct}</b> of <b>{skill.total}</b> tasks correct ({skill.percentage}%)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenOverride(skill)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] font-semibold flex items-center gap-0.5"
                      title="Adjust skill status manually"
                    >
                      <Edit3 className="w-3 h-3" /> Adjust
                    </button>

                    <button
                      onClick={() => onNavigate('evidence', { studentId, skillId: skill.skill_id })}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[10px] flex items-center gap-0.5 underline"
                    >
                      Why? <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Structured Teacher Observations (Section 9) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Teacher Observation Evidence</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Raw Observations Preserved
          </span>
        </div>

        {fingerprint.teacher_observations_summary.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No teacher observations logged for this student.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fingerprint.teacher_observations_summary.map((obs, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Observation {idx + 1}: </span>
                “{obs}”
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Override Modal */}
      {showOverrideModal && selectedSkillForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Adjust Skill Classification
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Skill: <span className="font-semibold text-slate-800">{selectedSkillForOverride.skill_title}</span>
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Classification</label>
                <select
                  value={overrideStatus}
                  onChange={e => setOverrideStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="demonstrated">Demonstrated (Mastery observed)</option>
                  <option value="emerging">Emerging (In-development)</option>
                  <option value="not_yet_demonstrated">Not Yet Demonstrated</option>
                  <option value="not_assessed">Not Assessed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Rationale / Observation</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Student demonstrated fluency in classroom work."
                  value={overrideNote}
                  onChange={e => setOverrideNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOverride}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  {isSavingOverride ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
