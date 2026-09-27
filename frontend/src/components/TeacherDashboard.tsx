import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  PageHeader,
  SectionHeader,
  ActionButton,
  StatBlock,
} from './common/InstitutionalUI';

interface TeacherDashboardProps {
  onNavigate: (screen: string, param?: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cls = await api.getClasses();
      setClasses(cls);
    } catch (e) {
      console.error(e);
    }
  };

  const primaryClass = classes.find(c => c.id === 'CLS_G3A') || classes[0] || {
    id: 'CLS_G3A',
    name: 'Grade 3 — Section A',
    grade: 3,
    language: 'Marathi',
    student_count: 30,
    completed_count: 22,
    in_progress_count: 2,
    not_assessed_count: 6
  };

  const completedPct = Math.round((primaryClass.completed_count / (primaryClass.student_count || 1)) * 100);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Page Header */}
      <PageHeader
        title="Classroom Overview"
        subtitle={`${primaryClass.name} • ${primaryClass.language} • Academic Session 2026–2027`}
        badge="Overview"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ActionButton
              variant="secondary"
              onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
            >
              Student Roster
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={() => onNavigate('learning_map', { classId: primaryClass.id })}
            >
              Classroom Learning Map
            </ActionButton>
          </div>
        }
      />

      {/* Platform Principle */}
      <div className="border-l-4 border-[#17365D] bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4">
        <p className="text-[11px] font-sans uppercase tracking-wider font-bold text-[#8A2F35] mb-1">
          Assessment Principle
        </p>
        <blockquote className="font-serif text-base text-[#17365D] leading-snug italic">
          "Before asking how to teach a child, first understand what the child has actually demonstrated."
        </blockquote>
        <p className="text-xs text-[#666666] font-sans mt-2 leading-relaxed">
          This platform records observable, task-level evidence without assigning unsupported labels or permanent classifications.
          Evidence collected in the classroom establishes the foundation for identifying learning needs and planning instruction.
        </p>
      </div>

      {/* Assessment Coverage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock
          label="Total Enrollment"
          value={primaryClass.student_count}
          sublabel="Grade 3 Section A"
        />
        <StatBlock
          label="Assessment Complete"
          value={primaryClass.completed_count}
          sublabel={`${completedPct}% of class`}
          highlight
        />
        <StatBlock
          label="In Progress"
          value={primaryClass.in_progress_count}
          sublabel="Partial evidence logged"
        />
        <StatBlock
          label="Not Yet Assessed"
          value={primaryClass.not_assessed_count}
          sublabel="Pending baseline"
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Assessment Coverage */}
        <div className="lg:col-span-6 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <SectionHeader
              label="Coverage"
              title="Classroom Assessment Status"
            />

            <div className="space-y-4 my-4">
              <div className="flex justify-between items-baseline text-xs font-sans">
                <span className="font-medium text-[#252525]">Assessment Coverage</span>
                <span className="font-semibold text-[#17365D]">
                  {primaryClass.completed_count} of {primaryClass.student_count} ({completedPct}%)
                </span>
              </div>

              <div className="h-2.5 w-full bg-[#EFECE5] rounded-xs overflow-hidden flex border border-[#D9D3C7]">
                <div
                  style={{ width: `${(primaryClass.completed_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#4F7658] h-full"
                  title={`Evidence complete: ${primaryClass.completed_count}`}
                />
                <div
                  style={{ width: `${(primaryClass.in_progress_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#A87932] h-full"
                  title={`In progress: ${primaryClass.in_progress_count}`}
                />
                <div
                  style={{ width: `${(primaryClass.not_assessed_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#D5CFC3] h-full"
                  title={`Not yet assessed: ${primaryClass.not_assessed_count}`}
                />
              </div>

              <div className="divide-y divide-[#EFECE5] text-xs font-sans">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#4F7658]" />
                    <span className="text-[#252525]">Evidence Complete</span>
                  </span>
                  <span className="font-medium text-[#17365D]">{primaryClass.completed_count} / {primaryClass.student_count}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#A87932]" />
                    <span className="text-[#252525]">Partially Assessed</span>
                  </span>
                  <span className="font-medium text-[#17365D]">{primaryClass.in_progress_count} / {primaryClass.student_count}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#D5CFC3]" />
                    <span className="text-[#252525]">Not Yet Assessed</span>
                  </span>
                  <span className="font-medium text-[#17365D]">{primaryClass.not_assessed_count} / {primaryClass.student_count}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9D3C7] flex flex-wrap gap-2">
            <ActionButton
              variant="primary"
              onClick={() => onNavigate('assessment', { studentId: 'ST025' })}
            >
              Assess Next Student →
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
            >
              View All Students
            </ActionButton>
          </div>
        </div>

        {/* Right: Quick Access + Student Profiles */}
        <div className="lg:col-span-6 space-y-4">

          {/* Quick Actions */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-4">
            <p className="text-[11px] font-sans uppercase tracking-wider font-bold text-[#525252] mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
                className="text-left px-3 py-2.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] hover:bg-[#F1EEE7] transition-colors"
              >
                <p className="text-xs font-sans font-semibold text-[#17365D]">View Students</p>
                <p className="text-[10px] font-sans text-[#737373] mt-0.5">Class roster & profiles</p>
              </button>
              <button
                onClick={() => onNavigate('diagnostic_overview', { classId: primaryClass.id })}
                className="text-left px-3 py-2.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] hover:bg-[#F1EEE7] transition-colors"
              >
                <p className="text-xs font-sans font-semibold text-[#17365D]">Learning Insights</p>
                <p className="text-[10px] font-sans text-[#737373] mt-0.5">Gaps & support needs</p>
              </button>
              <button
                onClick={() => onNavigate('teach_and_adapt', { classId: primaryClass.id })}
                className="text-left px-3 py-2.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] hover:bg-[#F1EEE7] transition-colors"
              >
                <p className="text-xs font-sans font-semibold text-[#17365D]">Teaching Plan</p>
                <p className="text-[10px] font-sans text-[#737373] mt-0.5">Orchestrate & observe</p>
              </button>
              <button
                onClick={() => onNavigate('school_intelligence')}
                className="text-left px-3 py-2.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] hover:bg-[#F1EEE7] transition-colors"
              >
                <p className="text-xs font-sans font-semibold text-[#17365D]">School Intelligence</p>
                <p className="text-[10px] font-sans text-[#737373] mt-0.5">Classroom-level patterns</p>
              </button>
            </div>
          </div>

          {/* Sample Assessment Records */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-4">
            <SectionHeader
              label="Learning Profiles"
              title="Recent Assessment Records"
            />
            <p className="text-xs text-[#666666] font-sans mb-3">
              Select a student to review their evidence-grounded learning profile:
            </p>

            <div className="divide-y divide-[#EFECE5] border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] text-xs font-sans">
              {[
                { id: 'ST001', roll: '01', name: 'Aarav Sharma',   reading: 'Demonstrated', readingColor: '#3B5E43', numeracy: 'Emerging (subtraction)', numeracyColor: '#8F6627' },
                { id: 'ST002', roll: '02', name: 'Ananya Deshmukh', reading: 'Emerging',     readingColor: '#8F6627', numeracy: 'Demonstrated',           numeracyColor: '#3B5E43' },
                { id: 'ST003', roll: '03', name: 'Rohan Kulkarni',  reading: 'Emerging',     readingColor: '#8F6627', numeracy: 'Emerging',               numeracyColor: '#8F6627' },
                { id: 'ST004', roll: '04', name: 'Priya Gaikwad',   reading: 'Demonstrated', readingColor: '#3B5E43', numeracy: 'Demonstrated',           numeracyColor: '#3B5E43' },
              ].map(s => (
                <div
                  key={s.id}
                  onClick={() => onNavigate('fingerprint', { studentId: s.id })}
                  className="p-3 hover:bg-[#F1EEE7] cursor-pointer transition-colors flex items-center justify-between"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onNavigate('fingerprint', { studentId: s.id })}
                >
                  <div>
                    <p className="font-serif font-bold text-[#17365D] text-[13px]">{s.roll} — {s.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[#525252]">Reading: <b style={{ color: s.readingColor }}>{s.reading}</b></span>
                      <span className="text-[#B8B0A2]">•</span>
                      <span className="text-[#525252]">Numeracy: <b style={{ color: s.numeracyColor }}>{s.numeracy}</b></span>
                    </div>
                  </div>
                  <span className="text-[11px] font-sans font-medium text-[#17365D] hover:underline ml-3 shrink-0">
                    View Profile →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Workflow Chain */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-5">
        <p className="text-[11px] font-sans uppercase tracking-wider font-bold text-[#525252] mb-4">
          Evidence Workflow
        </p>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {[
            { step: 'Assess', desc: 'Record task responses & observations' },
            { step: 'Evidence', desc: 'Build learning profile' },
            { step: 'Insight', desc: 'Identify learning needs' },
            { step: 'Plan', desc: 'Structure classroom instruction' },
            { step: 'Teach', desc: 'Deliver & observe' },
            { step: 'Adapt', desc: 'Adjust based on evidence' },
            { step: 'Monitor', desc: 'School-level signals' },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center shrink-0 px-3 first:pl-0">
                <div className="text-[11px] font-sans font-semibold text-[#17365D] whitespace-nowrap">{s.step}</div>
                <div className="text-[9.5px] font-sans text-[#737373] text-center whitespace-nowrap mt-0.5 hidden lg:block">{s.desc}</div>
              </div>
              {i < 6 && (
                <div className="text-[#D9D3C7] shrink-0 text-sm mx-0.5">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Institutional Framework Notice */}
      <div className="border border-[#D9D3C7] rounded-[4px] p-4 bg-[#F1EEE7] text-xs font-sans text-[#525252] leading-relaxed">
        <p className="font-bold text-[#17365D] mb-1 uppercase tracking-wide text-[11px]">
          Institutional Context & Assessment Scope
        </p>
        <p>
          Tasks are structured according to foundational literacy and numeracy principles aligned with ASER, CBSE FLN, EGRA, and EGMA frameworks.
          This platform records task results and teacher observations without predicting risk, generating automatic groups, or issuing automated lesson interventions.
          All AI-assisted summaries are clearly labelled and remain subject to teacher verification.
        </p>
      </div>

    </div>
  );
};
