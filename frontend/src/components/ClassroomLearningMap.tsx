import React, { useState, useEffect } from 'react';
import { api, ClassroomLearningMap as MapType } from '../services/api';
import { 
  PageHeader, 
  ActionButton 
} from './common/InstitutionalUI';

interface ClassroomLearningMapProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const ClassroomLearningMap: React.FC<ClassroomLearningMapProps> = ({ classId, onNavigate }) => {
  const [learningMap, setLearningMap] = useState<MapType | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalData, setModalData] = useState<{
    skillTitle: string;
    category: string;
    count: number;
    students: string[];
    domain: string;
  } | null>(null);

  useEffect(() => {
    loadLearningMap();
  }, [classId]);

  const loadLearningMap = async () => {
    setLoading(true);
    try {
      const data = await api.getClassroomLearningMap(classId || 'CLS_G3A');
      setLearningMap(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (
    skillTitle: string, 
    category: string, 
    count: number, 
    students: string[], 
    domain: string
  ) => {
    if (count === 0) return;
    setModalData({
      skillTitle,
      category,
      count,
      students,
      domain
    });
  };

  if (loading || !learningMap) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Compiling Classroom Learning Map matrix...
      </div>
    );
  }

  const renderDistributionBar = (dem: number, emg: number, notYet: number, notAss: number, total: number) => {
    const tot = total || 1;
    const demPct = (dem / tot) * 100;
    const emgPct = (emg / tot) * 100;
    const notYetPct = (notYet / tot) * 100;
    const notAssPct = (notAss / tot) * 100;

    return (
      <div className="h-2 w-full bg-[#EFECE5] rounded-xs overflow-hidden flex border border-[#D9D3C7]">
        <div style={{ width: `${demPct}%` }} className="bg-[#4F7658] h-full" title={`Demonstrated: ${dem}`} />
        <div style={{ width: `${emgPct}%` }} className="bg-[#A87932] h-full" title={`Emerging: ${emg}`} />
        <div style={{ width: `${notYetPct}%` }} className="bg-[#9A4A4A] h-full" title={`Not Yet: ${notYet}`} />
        <div style={{ width: `${notAssPct}%` }} className="bg-[#D5CFC3] h-full" title={`Not Assessed: ${notAss}`} />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumb="Dashboard"
        onBreadcrumbClick={() => onNavigate('dashboard')}
        title="Classroom Learning Map"
        subtitle={`Distribution of demonstrated foundational skills across ${learningMap.class_name} • Grade ${learningMap.grade}`}
        badge="Foundational Matrix"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('class_overview', { classId })}
            >
              Class Roster ({learningMap.total_students})
            </ActionButton>
            <ActionButton 
              variant="primary"
              onClick={() => onNavigate('assessment', { studentId: 'ST025' })}
            >
              Assess Next Student →
            </ActionButton>
          </div>
        }
      />

      {/* Coverage & Institutional Legend Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Coverage Stat */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#666666] font-semibold">Total Assessed</p>
          <p className="font-serif font-bold text-xl text-[#17365D]">
            {learningMap.assessed_count} <span className="text-xs font-normal text-[#737373]">/ {learningMap.total_students}</span>
          </p>
          <p className="text-[10px] text-[#3B5E43] font-medium mt-0.5">
            {Math.round((learningMap.assessed_count / learningMap.total_students) * 100)}% Classroom Baseline
          </p>
        </div>

        {/* Legend: Demonstrated */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#4F7658] shrink-0" />
          <div>
            <p className="font-semibold text-[#252525]">Demonstrated</p>
            <p className="text-[10px] text-[#666666]">≥ 80% task competency</p>
          </div>
        </div>

        {/* Legend: Emerging */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#A87932] shrink-0" />
          <div>
            <p className="font-semibold text-[#252525]">Emerging</p>
            <p className="text-[10px] text-[#666666]">40% – 79% developing</p>
          </div>
        </div>

        {/* Legend: Not Yet */}
        <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#9A4A4A] shrink-0" />
          <div>
            <p className="font-semibold text-[#252525]">Not Yet Demonstrated</p>
            <p className="text-[10px] text-[#666666]">&lt; 40% task accuracy</p>
          </div>
        </div>

      </div>

      {/* Reading Progression Matrix */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] overflow-hidden">
        <div className="bg-[#F1EEE7] border-b border-[#D9D3C7] px-4 py-2.5 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#17365D]">
            FOUNDATIONAL LITERACY PROGRESSION MATRIX
          </h3>
          <span className="text-[10px] font-sans font-semibold text-[#666666] uppercase">
            ASER & CBSE FLN Frameworks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="institutional-table">
            <thead>
              <tr>
                <th className="py-2.5 px-4 text-left w-1/4">Foundational Skill</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#3B5E43] bg-[#EDF3EE]/50">Demonstrated</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#8F6627] bg-[#FAF4EB]/50">Emerging</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#873F3F] bg-[#F9EDED]/50">Not Yet</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#5F5F5F] bg-[#EFECE5]/50">Not Assessed</th>
                <th className="py-2.5 px-4 w-1/3">Classroom Distribution</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {learningMap.reading_matrix.map(skill => (
                <tr key={skill.skill_id} className="hover:bg-[#F1EEE7] transition-colors">
                  <td className="py-2.5 px-4 font-serif font-semibold text-[#17365D]">
                    {skill.skill_title}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Demonstrated', skill.demonstrated_count, skill.students_demonstrated, 'reading')}
                    className="py-2.5 px-4 text-center font-bold text-[#3B5E43] bg-[#EDF3EE]/30 hover:bg-[#DCE7DE] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.demonstrated_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Emerging', skill.emerging_count, skill.students_emerging, 'reading')}
                    className="py-2.5 px-4 text-center font-bold text-[#8F6627] bg-[#FAF4EB]/30 hover:bg-[#F3E7D3] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.emerging_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Yet Demonstrated', skill.not_yet_count, skill.students_not_yet, 'reading')}
                    className="py-2.5 px-4 text-center font-bold text-[#873F3F] bg-[#F9EDED]/30 hover:bg-[#F2D7D7] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.not_yet_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Assessed', skill.not_assessed_count, skill.students_not_assessed, 'reading')}
                    className="py-2.5 px-4 text-center text-[#5F5F5F] bg-[#EFECE5]/30 hover:bg-[#E3DFD5] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.not_assessed_count}
                  </td>
                  <td className="py-2.5 px-4">
                    {renderDistributionBar(
                      skill.demonstrated_count,
                      skill.emerging_count,
                      skill.not_yet_count,
                      skill.not_assessed_count,
                      learningMap.total_students
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Numeracy Progression Matrix */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] overflow-hidden">
        <div className="bg-[#F1EEE7] border-b border-[#D9D3C7] px-4 py-2.5 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#17365D]">
            FOUNDATIONAL NUMERACY PROGRESSION MATRIX
          </h3>
          <span className="text-[10px] font-sans font-semibold text-[#666666] uppercase">
            EGMA & CBSE FLN Frameworks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="institutional-table">
            <thead>
              <tr>
                <th className="py-2.5 px-4 text-left w-1/4">Foundational Skill</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#3B5E43] bg-[#EDF3EE]/50">Demonstrated</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#8F6627] bg-[#FAF4EB]/50">Emerging</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#873F3F] bg-[#F9EDED]/50">Not Yet</th>
                <th className="py-2.5 px-4 text-center w-28 text-[#5F5F5F] bg-[#EFECE5]/50">Not Assessed</th>
                <th className="py-2.5 px-4 w-1/3">Classroom Distribution</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {learningMap.numeracy_matrix.map(skill => (
                <tr key={skill.skill_id} className="hover:bg-[#F1EEE7] transition-colors">
                  <td className="py-2.5 px-4 font-serif font-semibold text-[#17365D]">
                    {skill.skill_title}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Demonstrated', skill.demonstrated_count, skill.students_demonstrated, 'numeracy')}
                    className="py-2.5 px-4 text-center font-bold text-[#3B5E43] bg-[#EDF3EE]/30 hover:bg-[#DCE7DE] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.demonstrated_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Emerging', skill.emerging_count, skill.students_emerging, 'numeracy')}
                    className="py-2.5 px-4 text-center font-bold text-[#8F6627] bg-[#FAF4EB]/30 hover:bg-[#F3E7D3] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.emerging_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Yet Demonstrated', skill.not_yet_count, skill.students_not_yet, 'numeracy')}
                    className="py-2.5 px-4 text-center font-bold text-[#873F3F] bg-[#F9EDED]/30 hover:bg-[#F2D7D7] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.not_yet_count}
                  </td>
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Assessed', skill.not_assessed_count, skill.students_not_assessed, 'numeracy')}
                    className="py-2.5 px-4 text-center text-[#5F5F5F] bg-[#EFECE5]/30 hover:bg-[#E3DFD5] cursor-pointer"
                    title="Click to view students"
                  >
                    {skill.not_assessed_count}
                  </td>
                  <td className="py-2.5 px-4">
                    {renderDistributionBar(
                      skill.demonstrated_count,
                      skill.emerging_count,
                      skill.not_yet_count,
                      skill.not_assessed_count,
                      learningMap.total_students
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classroom Pedagogical Insight & Phase 2 Transition Statement */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-3 text-xs text-[#525252]">
        <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
          <span className="font-bold text-[#17365D] uppercase tracking-wide text-[10px]">
            Classroom Foundational Baseline Summary
          </span>
          <span className="text-[10px] text-[#8A2F35] font-semibold">
            Institutional Research Metric
          </span>
        </div>
        <p className="text-sm font-serif leading-relaxed text-[#252525]">
          {learningMap.summary_insight}
        </p>

        <div className="pt-2 text-[11px] font-sans text-[#666666] border-t border-[#D9D3C7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="italic">
            “Now that the platform understands the classroom baseline, Phase 2 will diagnose specific learning gaps and recommend the next instructional move.”
          </span>
          <span className="font-semibold text-[#17365D]">
            Phase 1 Baseline Ready
          </span>
        </div>
      </div>

      {/* Student List Popover Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#FCFBF8] rounded-[6px] border border-[#B8B0A2] p-5 max-w-md w-full shadow-md font-sans">
            <div className="flex items-baseline justify-between pb-2 border-b border-[#D9D3C7] mb-3">
              <div>
                <h3 className="font-serif font-bold text-[#17365D] text-base">
                  {modalData.skillTitle}
                </h3>
                <p className="text-xs text-[#666666]">
                  Classification: <b className="text-[#252525]">{modalData.category}</b> ({modalData.count} Students)
                </p>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-[#737373] hover:text-[#252525] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs">
              {modalData.students.map((name, i) => (
                <div key={i} className="py-1.5 px-2.5 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[3px] flex items-center justify-between text-[#252525]">
                  <span>{name}</span>
                  <span className="text-[10px] text-[#737373] font-mono">#{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 mt-3 border-t border-[#D9D3C7]">
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => setModalData(null)}
              >
                Close Record
              </ActionButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
