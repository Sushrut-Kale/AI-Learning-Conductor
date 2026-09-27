import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Map, 
  BookOpen, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CircleDot, 
  Users, 
  Sparkles, 
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { api, ClassroomLearningMap as MapType } from '../services/api';

interface ClassroomLearningMapProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const ClassroomLearningMap: React.FC<ClassroomLearningMapProps> = ({ classId, onNavigate }) => {
  const [learningMap, setLearningMap] = useState<MapType | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal for inspecting students in a cell
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Synthesizing Classroom Learning Map...</p>
        </div>
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
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
        <div style={{ width: `${demPct}%` }} className="bg-emerald-500 h-full" title={`Demonstrated: ${dem}`} />
        <div style={{ width: `${emgPct}%` }} className="bg-amber-400 h-full" title={`Emerging: ${emg}`} />
        <div style={{ width: `${notYetPct}%` }} className="bg-rose-500 h-full" title={`Not Yet: ${notYet}`} />
        <div style={{ width: `${notAssPct}%` }} className="bg-slate-300 h-full" title={`Not Assessed: ${notAss}`} />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Classroom Learning Map
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {learningMap.class_name} • Grade {learningMap.grade}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Foundational learning landscape across literacy and numeracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('class_overview', { classId })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Class Roster ({learningMap.total_students})</span>
          </button>
          <button
            onClick={() => onNavigate('assessment', { studentId: 'ST025' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
          >
            <span>Assess Next Student</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Classroom Status Stats & Principle Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Core Philosophy Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 1 Final Deliverable</span>
            </div>
            <h2 className="text-base font-bold text-white mb-2">Evidence-Based Classroom Map</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Visualizes foundational variation across individual children without ranking, grading, or permanent labels. 
              Gives the teacher instant clarity on where the whole class currently stands.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-700/80 mt-3 text-[11px] text-indigo-200 italic">
            Click any cell in the matrix below to see the specific students.
          </div>
        </div>

        {/* Assessed Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center flex flex-col justify-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Assessment Coverage</p>
          <p className="text-2xl font-bold text-slate-900">
            {learningMap.assessed_count} <span className="text-sm font-normal text-slate-400">/ {learningMap.total_students}</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {Math.round((learningMap.assessed_count / learningMap.total_students) * 100)}% Complete
          </p>
        </div>

        {/* Legend Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Mastery Legend</p>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-xs">Demonstrated (≥80%)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <span className="font-semibold text-xs">Emerging (40-79%)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            <span className="font-semibold text-xs">Not Yet Demonstrated</span>
          </div>
        </div>

      </div>

      {/* Classroom FLN Matrix: Reading */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Foundational Literacy Matrix</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            ASER & CBSE FLN Inspired
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-1/4">Foundational Skill</th>
                <th className="py-3 px-4 text-center w-28 text-emerald-800 bg-emerald-50/30">Demonstrated</th>
                <th className="py-3 px-4 text-center w-28 text-amber-800 bg-amber-50/30">Emerging</th>
                <th className="py-3 px-4 text-center w-28 text-rose-800 bg-rose-50/30">Not Yet</th>
                <th className="py-3 px-4 text-center w-28 text-slate-600 bg-slate-50/40">Not Assessed</th>
                <th className="py-3 px-4 w-1/3">Classroom Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {learningMap.reading_matrix.map(skill => (
                <tr key={skill.skill_id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Skill Name */}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {skill.skill_title}
                  </td>

                  {/* Demonstrated */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Demonstrated', skill.demonstrated_count, skill.students_demonstrated, 'reading')}
                    className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-900">
                      {skill.demonstrated_count}
                    </span>
                  </td>

                  {/* Emerging */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Emerging', skill.emerging_count, skill.students_emerging, 'reading')}
                    className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/20 hover:bg-amber-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900">
                      {skill.emerging_count}
                    </span>
                  </td>

                  {/* Not Yet */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Yet Demonstrated', skill.not_yet_count, skill.students_not_yet, 'reading')}
                    className="py-3 px-4 text-center font-bold text-rose-700 bg-rose-50/20 hover:bg-rose-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-rose-100/70 text-rose-900">
                      {skill.not_yet_count}
                    </span>
                  </td>

                  {/* Not Assessed */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Assessed', skill.not_assessed_count, skill.students_not_assessed, 'reading')}
                    className="py-3 px-4 text-center font-medium text-slate-500 bg-slate-50/30 hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Click to view unassessed students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-slate-200/60 text-slate-700">
                      {skill.not_assessed_count}
                    </span>
                  </td>

                  {/* Distribution Bar */}
                  <td className="py-3 px-4">
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

      {/* Classroom FLN Matrix: Numeracy */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Foundational Numeracy Matrix</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            EGMA & CBSE FLN Inspired
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-1/4">Foundational Skill</th>
                <th className="py-3 px-4 text-center w-28 text-emerald-800 bg-emerald-50/30">Demonstrated</th>
                <th className="py-3 px-4 text-center w-28 text-amber-800 bg-amber-50/30">Emerging</th>
                <th className="py-3 px-4 text-center w-28 text-rose-800 bg-rose-50/30">Not Yet</th>
                <th className="py-3 px-4 text-center w-28 text-slate-600 bg-slate-50/40">Not Assessed</th>
                <th className="py-3 px-4 w-1/3">Classroom Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {learningMap.numeracy_matrix.map(skill => (
                <tr key={skill.skill_id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Skill Name */}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {skill.skill_title}
                  </td>

                  {/* Demonstrated */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Demonstrated', skill.demonstrated_count, skill.students_demonstrated, 'numeracy')}
                    className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-900">
                      {skill.demonstrated_count}
                    </span>
                  </td>

                  {/* Emerging */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Emerging', skill.emerging_count, skill.students_emerging, 'numeracy')}
                    className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/20 hover:bg-amber-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900">
                      {skill.emerging_count}
                    </span>
                  </td>

                  {/* Not Yet */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Yet Demonstrated', skill.not_yet_count, skill.students_not_yet, 'numeracy')}
                    className="py-3 px-4 text-center font-bold text-rose-700 bg-rose-50/20 hover:bg-rose-100/60 cursor-pointer transition-colors"
                    title="Click to view students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-rose-100/70 text-rose-900">
                      {skill.not_yet_count}
                    </span>
                  </td>

                  {/* Not Assessed */}
                  <td 
                    onClick={() => handleCellClick(skill.skill_title, 'Not Assessed', skill.not_assessed_count, skill.students_not_assessed, 'numeracy')}
                    className="py-3 px-4 text-center font-medium text-slate-500 bg-slate-50/30 hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Click to view unassessed students"
                  >
                    <span className="px-2.5 py-1 rounded-md bg-slate-200/60 text-slate-700">
                      {skill.not_assessed_count}
                    </span>
                  </td>

                  {/* Distribution Bar */}
                  <td className="py-3 px-4">
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

      {/* Classroom Insight & Phase 2 Transition Roadmap Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl border border-blue-200 p-6 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Section 22 & 25: Phase 1 Completion & Future AI Connection</span>
        </div>
        
        <p className="text-slate-800 text-sm leading-relaxed">
          {learningMap.summary_insight}
        </p>

        <div className="pt-3 border-t border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <span className="font-semibold italic">
            “Now that the system understands the classroom, Phase 2 can diagnose the learning gaps and determine the next learning move.”
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] self-start sm:self-auto shrink-0 shadow-2xs">
            Ready for Phase 2 API Consumption
          </span>
        </div>
      </div>

      {/* Interactive Modal to Inspect Students in Cell */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{modalData.skillTitle}</h3>
                <p className="text-xs text-slate-500">
                  Category: <span className="font-semibold text-slate-800">{modalData.category}</span> ({modalData.count} Students)
                </p>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {modalData.students.map((name, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 border border-slate-100 flex items-center justify-between">
                  <span>{name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
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
