import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  ArrowRight, 
  Sparkles, 
  Play, 
  BookOpen, 
  GraduationCap, 
  FileSearch, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface TeacherDashboardProps {
  onNavigate: (screen: string, param?: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cls = await api.getClasses();
      setClasses(cls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Foundational Principle Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Learning Conductor • Phase 1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Assess & Build the Learning Map
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            “Before asking AI how to teach a child, first make sure AI understands what the child has actually demonstrated.”
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Evidence-First Grounding
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> ASER & CBSE FLN Inspired
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Zero Premature Labelling
            </span>
          </div>
        </div>
      </div>

      {/* Primary Class Overview & Progress Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Class Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{primaryClass.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Grade {primaryClass.grade} • {primaryClass.language}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Zilla Parishad Primary School • Academic Year 2026-2027</p>
            </div>
            <button
              onClick={() => onNavigate('class_overview', { classId: primaryClass.id })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>View Roster</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Assessment Completion Progress</span>
              <span>{primaryClass.completed_count} of {primaryClass.student_count} Completed ({completedPct}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              <div 
                style={{ width: `${(primaryClass.completed_count / primaryClass.student_count) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500" 
                title={`${primaryClass.completed_count} Completed`}
              />
              <div 
                style={{ width: `${(primaryClass.in_progress_count / primaryClass.student_count) * 100}%` }}
                className="bg-amber-400 h-full transition-all duration-500" 
                title={`${primaryClass.in_progress_count} In Progress`}
              />
              <div 
                style={{ width: `${(primaryClass.not_assessed_count / primaryClass.student_count) * 100}%` }}
                className="bg-slate-300 h-full transition-all duration-500" 
                title={`${primaryClass.not_assessed_count} Not Assessed`}
              />
            </div>
          </div>

          {/* Status Metric Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </div>
              <p className="text-xl font-bold text-emerald-900">{primaryClass.completed_count}</p>
              <p className="text-[10px] text-emerald-600">Students</p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>In Progress</span>
              </div>
              <p className="text-xl font-bold text-amber-900">{primaryClass.in_progress_count}</p>
              <p className="text-[10px] text-amber-600">Students</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs font-medium mb-1">
                <CircleDot className="w-3.5 h-3.5" />
                <span>Not Assessed</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{primaryClass.not_assessed_count}</p>
              <p className="text-[10px] text-slate-500">Ready for Live</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('assessment', { studentId: 'ST025' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Assess Next Student (Arjun Nalawade)</span>
            </button>

            <button
              onClick={() => onNavigate('learning_map', { classId: primaryClass.id })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <span>Explore Classroom Learning Map</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Demo Archetypes Quick-Launch Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base">Demo Scenario Profiles</h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-semibold">
                Section 22
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Explore the 4 foundational archetypes generated from evidence:
            </p>

            <div className="space-y-2.5">
              {/* Student A */}
              <div 
                onClick={() => onNavigate('fingerprint', { studentId: 'ST001' })}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Student A: Aarav Sharma</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Strong Reading • Subtraction Emerging</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Student B */}
              <div 
                onClick={() => onNavigate('fingerprint', { studentId: 'ST002' })}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Student B: Ananya Deshmukh</p>
                  <p className="text-[11px] text-blue-700 font-medium">Strong Numeracy • Emerging Reading</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Student C */}
              <div 
                onClick={() => onNavigate('fingerprint', { studentId: 'ST003' })}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Student C: Rohan Kulkarni</p>
                  <p className="text-[11px] text-amber-700 font-medium">Emerging Reading • Emerging Numeracy</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Student D */}
              <div 
                onClick={() => onNavigate('fingerprint', { studentId: 'ST004' })}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Student D: Priya Gaikwad</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Demonstrated in Both Domains</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-500 italic">
            Click any profile to view its evidence breakdown & explanation.
          </div>
        </div>

      </div>

      {/* Architecture & Boundaries Explanatory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What Phase 1 Builds
          </h4>
          <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
            <li>Modular Foundational Literacy & Numeracy assessment (ASER/CBSE inspired)</li>
            <li>Raw evidence preservation (items, student responses, teacher observations)</li>
            <li>Evidence-grounded <b>Learning Fingerprint</b> (Demonstrated / Emerging / Not Yet)</li>
            <li>Interactive <b>Classroom Learning Map</b> showing classroom-level variation</li>
            <li>Offline-first local IndexedDB storage with sync queue</li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" /> Explicit Phase 1 Boundaries (Section 24)
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li><b>No misconception diagnosis</b> (no psychologizing or disability inference)</li>
            <li><b>No dynamic grouping</b> (belongs to Phase 3)</li>
            <li><b>No lesson plans or worksheets</b> (belongs to Phase 4)</li>
            <li><b>No student ranking or high-stakes decision making</b></li>
            <li>Teacher retains complete control to review, edit, or override any classification</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
