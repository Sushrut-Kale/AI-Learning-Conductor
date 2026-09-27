import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  Play, 
  FileText, 
  FileSearch, 
  Plus, 
  UserPlus, 
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface ClassOverviewProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({ classId, onNavigate }) => {
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_assessed'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    loadClass();
  }, [classId]);

  const loadClass = async () => {
    setLoading(true);
    try {
      const res = await api.getClassDetails(classId || 'CLS_G3A');
      setClassInfo(res.class_info);
      setStudents(res.students || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId || 'CLS_G3A',
          name: newStudentName.trim(),
          grade: 3,
          language: 'Marathi'
        })
      });
      if (res.ok) {
        setNewStudentName('');
        setShowAddModal(false);
        loadClass();
      }
    } catch (e) {
      alert('Failed to add student');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.roll_number.includes(searchTerm);
    const matchesFilter = statusFilter === 'all' || s.assessment_status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const completedCount = students.filter(s => s.assessment_status === 'completed').length;
  const inProgCount = students.filter(s => s.assessment_status === 'in_progress').length;
  const notAssCount = students.filter(s => s.assessment_status === 'not_assessed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {classInfo?.name || 'Grade 3 — Section A'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Grade 3 • {classInfo?.language || 'Marathi'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Zilla Parishad Primary School • Teacher: Sunita Patil • Total Students: {students.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('learning_map', { classId })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <span>Classroom Learning Map</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'in_progress'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress ({inProgCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('not_assessed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'not_assessed'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Not Assessed ({notAssCount})</span>
          </button>
        </div>

      </div>

      {/* Students Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Grade & Lang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Foundational Evidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Roll */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                      #{student.roll_number}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-2xs"
                          style={{ backgroundColor: student.avatar_color || '#4F46E5' }}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[10px] text-slate-400">{student.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Grade & Lang */}
                    <td className="py-3.5 px-4 text-slate-600">
                      Grade {student.grade} • {student.language}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {student.assessment_status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      )}
                      {student.assessment_status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>In Progress</span>
                        </span>
                      )}
                      {student.assessment_status === 'not_assessed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <CircleDot className="w-3 h-3 text-slate-400" />
                          <span>Not Assessed</span>
                        </span>
                      )}
                    </td>

                    {/* Evidence summary preview */}
                    <td className="py-3.5 px-4">
                      {student.assessment_status === 'completed' ? (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            Profile Built
                          </span>
                          <span className="text-slate-500">24 Items Logged</span>
                        </div>
                      ) : student.assessment_status === 'in_progress' ? (
                        <span className="text-[11px] text-amber-700 font-medium">
                          4 Items Captured (Partially assessed)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Awaiting teacher assessment
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {student.assessment_status === 'completed' ? (
                        <>
                          <button
                            onClick={() => onNavigate('fingerprint', { studentId: student.id })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Fingerprint</span>
                          </button>
                          <button
                            onClick={() => onNavigate('evidence', { studentId: student.id })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                            title="Trace raw evidence items ('Why?')"
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                            <span>Evidence</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onNavigate('assessment', { studentId: student.id })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{student.assessment_status === 'in_progress' ? 'Resume' : 'Assess'}</span>
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Add New Student</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add student to Grade 3 — Section A for foundational assessment.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanmay Gaikwad"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructional Language</label>
                <input
                  type="text"
                  disabled
                  value="Marathi"
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
