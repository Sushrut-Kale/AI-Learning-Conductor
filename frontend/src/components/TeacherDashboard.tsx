import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  PageHeader, 
  SectionHeader, 
  ActionButton, 
  EditorialCallout, 
  StatBlock, 
  StatusBadge 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Institutional Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`${primaryClass.name} • Language: ${primaryClass.language} • Academic Session 2026–2027`}
        badge="Classroom Overview"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary" 
              onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
            >
              Class Roster (30)
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={() => onNavigate('learning_map', { classId: primaryClass.id })}
            >
              Classroom Learning Map
            </ActionButton>
            <ActionButton 
              variant="secondary" 
              onClick={() => onNavigate('teach_and_adapt', { classId: primaryClass.id })}
            >
              Teach & Adapt (Phase 4)
            </ActionButton>
          </div>
        }
      />

      {/* Editorial Assessment Principle Callout (Section 8) */}
      <EditorialCallout
        title="Assessment Principle"
        quote="Before asking how to teach a child, first understand what the child has actually demonstrated."
      >
        <p>
          This platform records observable task-level evidence without assigning unsupported diagnoses or permanent labels. 
          Evidence collected during Phase 1 establishes the baseline for classroom gap identification in subsequent modules.
        </p>
      </EditorialCallout>

      {/* Status Strip (Section 7) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock 
          label="Total Enrollment" 
          value={primaryClass.student_count} 
          sublabel="Grade 3 Section A"
        />
        <StatBlock 
          label="Completed" 
          value={primaryClass.completed_count} 
          sublabel={`${completedPct}% assessed`}
          highlight
        />
        <StatBlock 
          label="In Progress" 
          value={primaryClass.in_progress_count} 
          sublabel="Partial evidence logged"
        />
        <StatBlock 
          label="Not Assessed" 
          value={primaryClass.not_assessed_count} 
          sublabel="Pending baseline assessment"
        />
      </div>

      {/* Two Column Grid: Classroom Assessment Status & Demo Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left Column: Classroom Assessment Status (Section 9) */}
        <div className="lg:col-span-6 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <SectionHeader 
              label="Coverage & Administration"
              title="Classroom Assessment Status" 
            />

            <div className="space-y-4 my-4">
              <div className="flex justify-between items-baseline text-xs font-sans">
                <span className="font-medium text-[#252525]">Assessment Coverage</span>
                <span className="font-semibold text-[#17365D]">
                  {primaryClass.completed_count} of {primaryClass.student_count} Students ({completedPct}%)
                </span>
              </div>

              {/* Restrained Horizontal Progress Bar */}
              <div className="h-3 w-full bg-[#EFECE5] rounded-xs overflow-hidden flex border border-[#D9D3C7]">
                <div 
                  style={{ width: `${(primaryClass.completed_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#4F7658] h-full" 
                  title={`Completed: ${primaryClass.completed_count}`}
                />
                <div 
                  style={{ width: `${(primaryClass.in_progress_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#A87932] h-full" 
                  title={`In Progress: ${primaryClass.in_progress_count}`}
                />
                <div 
                  style={{ width: `${(primaryClass.not_assessed_count / primaryClass.student_count) * 100}%` }}
                  className="bg-[#D5CFC3] h-full" 
                  title={`Not Assessed: ${primaryClass.not_assessed_count}`}
                />
              </div>

              <div className="divide-y divide-[#EFECE5] text-xs font-sans">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#4F7658]" />
                    <span className="text-[#252525]">Completed Assessments</span>
                  </span>
                  <span className="font-medium text-[#17365D]">{primaryClass.completed_count} / {primaryClass.student_count}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#A87932]" />
                    <span className="text-[#252525]">In Progress</span>
                  </span>
                  <span className="font-medium text-[#17365D]">{primaryClass.in_progress_count} / {primaryClass.student_count}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-xs bg-[#D5CFC3]" />
                    <span className="text-[#252525]">Not Assessed</span>
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
              Assess Next Student (Arjun Nalawade)
            </ActionButton>
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
            >
              View Full Class Roster →
            </ActionButton>
          </div>
        </div>

        {/* Right Column: Demo Scenario Student Profiles (Section 10) */}
        <div className="lg:col-span-6 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[6px] p-5">
          <SectionHeader 
            label="Baseline Profiles"
            title="Sample Assessment Records" 
            rightElement={
              <span className="text-[10px] font-sans text-[#8A2F35] font-semibold">
                Section 22 Demonstration
              </span>
            }
          />
          <p className="text-xs text-[#666666] font-sans mb-3">
            Select an assessment profile to review the evidence-grounded Learning Fingerprint:
          </p>

          <div className="divide-y divide-[#EFECE5] border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] text-xs font-sans">
            
            {/* Student A */}
            <div 
              onClick={() => onNavigate('fingerprint', { studentId: 'ST001' })}
              className="p-3 hover:bg-[#F1EEE7] cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-serif font-bold text-[#17365D] text-sm">01 — Aarav Sharma</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#525252]">Reading: <b className="text-[#3B5E43]">Demonstrated</b></span>
                  <span className="text-[#B8B0A2]">•</span>
                  <span className="text-[#525252]">Numeracy: <b className="text-[#8F6627]">Emerging</b> (subtraction)</span>
                </div>
              </div>
              <span className="text-[11px] font-sans font-medium text-[#17365D] hover:underline">
                View Fingerprint →
              </span>
            </div>

            {/* Student B */}
            <div 
              onClick={() => onNavigate('fingerprint', { studentId: 'ST002' })}
              className="p-3 hover:bg-[#F1EEE7] cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-serif font-bold text-[#17365D] text-sm">02 — Ananya Deshmukh</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#525252]">Reading: <b className="text-[#8F6627]">Emerging</b></span>
                  <span className="text-[#B8B0A2]">•</span>
                  <span className="text-[#525252]">Numeracy: <b className="text-[#3B5E43]">Demonstrated</b></span>
                </div>
              </div>
              <span className="text-[11px] font-sans font-medium text-[#17365D] hover:underline">
                View Fingerprint →
              </span>
            </div>

            {/* Student C */}
            <div 
              onClick={() => onNavigate('fingerprint', { studentId: 'ST003' })}
              className="p-3 hover:bg-[#F1EEE7] cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-serif font-bold text-[#17365D] text-sm">03 — Rohan Kulkarni</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#525252]">Reading: <b className="text-[#8F6627]">Emerging</b></span>
                  <span className="text-[#B8B0A2]">•</span>
                  <span className="text-[#525252]">Numeracy: <b className="text-[#8F6627]">Emerging</b></span>
                </div>
              </div>
              <span className="text-[11px] font-sans font-medium text-[#17365D] hover:underline">
                View Fingerprint →
              </span>
            </div>

            {/* Student D */}
            <div 
              onClick={() => onNavigate('fingerprint', { studentId: 'ST004' })}
              className="p-3 hover:bg-[#F1EEE7] cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-serif font-bold text-[#17365D] text-sm">04 — Priya Gaikwad</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#525252]">Reading: <b className="text-[#3B5E43]">Demonstrated</b></span>
                  <span className="text-[#B8B0A2]">•</span>
                  <span className="text-[#525252]">Numeracy: <b className="text-[#3B5E43]">Demonstrated</b></span>
                </div>
              </div>
              <span className="text-[11px] font-sans font-medium text-[#17365D] hover:underline">
                View Fingerprint →
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Institutional Frameworks & Scope Notice */}
      <div className="border border-[#D9D3C7] rounded-[4px] p-4 bg-[#F1EEE7] text-xs font-sans text-[#525252] leading-relaxed">
        <p className="font-bold text-[#17365D] mb-1 uppercase tracking-wide text-[11px]">
          Institutional Context & Assessment Scope
        </p>
        <p>
          The modular tasks are structured according to foundational literacy and numeracy principles inspired by ASER, CBSE FLN, EGRA, and EGMA frameworks. 
          In Phase 1, the platform strictly records task results and teacher observations without predicting risk, generating dynamic groups, or automated lesson interventions.
        </p>
      </div>

    </div>
  );
};
