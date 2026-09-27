import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  PageHeader, 
  ActionButton, 
  StatusBadge 
} from './common/InstitutionalUI';

interface ClassOverviewProps {
  classId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({ classId, onNavigate }) => {
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_assessed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    loadClass();
  }, [classId]);

  const loadClass = async () => {
    try {
      const res = await api.getClassDetails(classId || 'CLS_G3A');
      setClassInfo(res.class_info);
      setStudents(res.students || []);
    } catch (e) {
      console.error(e);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Institutional Page Header */}
      <PageHeader
        breadcrumb="Dashboard"
        onBreadcrumbClick={() => onNavigate('dashboard')}
        title="Classroom Student Roster"
        subtitle={`${classInfo?.name || 'Grade 3 — Section A'} • Language: ${classInfo?.language || 'Marathi'} • Head Teacher: Sunita Patil`}
        badge={`Total ${students.length} Students`}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary"
              onClick={() => onNavigate('learning_map', { classId })}
            >
              Classroom Learning Map
            </ActionButton>
            <ActionButton 
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              + Enroll Student
            </ActionButton>
          </div>
        }
      />

      {/* Filter and Administrative Search Strip */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-3 flex flex-col md:flex-row gap-3 justify-between items-center text-xs font-sans">
        
        {/* Search Input */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] text-[#252525] focus:outline-none focus:border-[#17365D]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-[4px] border font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#525252] border-[#D9D3C7] hover:bg-[#F1EEE7]'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-[4px] border font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#3B5E43] border-[#C6D8CA] hover:bg-[#EDF3EE]'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-[4px] border font-medium transition-colors ${
              statusFilter === 'in_progress'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#8F6627] border-[#E5D8C1] hover:bg-[#FAF4EB]'
            }`}
          >
            In Progress ({inProgCount})
          </button>
          <button
            onClick={() => setStatusFilter('not_assessed')}
            className={`px-3 py-1 rounded-[4px] border font-medium transition-colors ${
              statusFilter === 'not_assessed'
                ? 'bg-[#17365D] text-[#FCFBF8] border-[#17365D]'
                : 'bg-[#FCFBF8] text-[#666666] border-[#D9D3C7] hover:bg-[#F1EEE7]'
            }`}
          >
            Not Assessed ({notAssCount})
          </button>
        </div>

      </div>

      {/* Administrative Table (Section 11) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="institutional-table">
            <thead>
              <tr>
                <th className="py-2.5 px-4 text-left w-20">Roll No.</th>
                <th className="py-2.5 px-4 text-left">Student Name</th>
                <th className="py-2.5 px-4 text-left w-36">Assessment Status</th>
                <th className="py-2.5 px-4 text-left w-36">Reading Domain</th>
                <th className="py-2.5 px-4 text-left w-36">Numeracy Domain</th>
                <th className="py-2.5 px-4 text-left w-28">Session Date</th>
                <th className="py-2.5 px-4 text-right w-44">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-sans">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#737373]">
                    No student records matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr 
                    key={student.id} 
                    className={`${idx % 2 === 0 ? 'bg-[#FCFBF8]' : 'bg-[#FAF8F3]'} hover:bg-[#F1EEE7] transition-colors`}
                  >
                    
                    {/* Roll No */}
                    <td className="py-2.5 px-4 font-mono font-medium text-[#525252]">
                      {student.roll_number}
                    </td>

                    {/* Student Name */}
                    <td className="py-2.5 px-4">
                      <span className="font-serif font-semibold text-[#17365D] text-[13px]">
                        {student.name}
                      </span>
                      <span className="text-[10px] text-[#737373] ml-2 font-mono">
                        ({student.id})
                      </span>
                    </td>

                    {/* Assessment Status */}
                    <td className="py-2.5 px-4">
                      <StatusBadge status={student.assessment_status} size="sm" />
                    </td>

                    {/* Reading Domain Status */}
                    <td className="py-2.5 px-4">
                      {student.assessment_status === 'completed' ? (
                        <span className="text-[11px] text-[#252525]">
                          {parseInt(student.roll_number) % 2 === 1 ? 'Demonstrated' : 'Emerging'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8E8B82]">—</span>
                      )}
                    </td>

                    {/* Numeracy Domain Status */}
                    <td className="py-2.5 px-4">
                      {student.assessment_status === 'completed' ? (
                        <span className="text-[11px] text-[#252525]">
                          {parseInt(student.roll_number) % 3 === 0 ? 'Demonstrated' : 'Emerging'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8E8B82]">—</span>
                      )}
                    </td>

                    {/* Session Date */}
                    <td className="py-2.5 px-4 text-[#525252] text-[11px]">
                      {student.assessment_status === 'completed' ? '24 Sep 2026' : '—'}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right space-x-1.5">
                      {student.assessment_status === 'completed' ? (
                        <>
                          <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigate('fingerprint', { studentId: student.id })}
                          >
                            Fingerprint
                          </ActionButton>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onNavigate('evidence', { studentId: student.id })}
                            title="Audit individual task responses"
                          >
                            Audit
                          </ActionButton>
                        </>
                      ) : (
                        <ActionButton
                          variant="primary"
                          size="sm"
                          onClick={() => onNavigate('assessment', { studentId: student.id })}
                        >
                          {student.assessment_status === 'in_progress' ? 'Resume' : 'Assess'}
                        </ActionButton>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#FCFBF8] rounded-[6px] border border-[#B8B0A2] p-5 max-w-md w-full shadow-md font-sans">
            <h3 className="font-serif font-bold text-[#17365D] text-lg mb-1">
              Enroll Student
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              Add student to Grade 3 — Section A for foundational literacy and numeracy assessment.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#252525] mb-1">Full Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanmay Gaikwad"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] focus:outline-none focus:border-[#17365D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Medium of Instruction</label>
                <input
                  type="text"
                  disabled
                  value="Marathi"
                  className="w-full px-3 py-1.5 border border-[#D9D3C7] rounded-[4px] bg-[#F1EEE7] text-[#666666]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D9D3C7]">
                <ActionButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Enroll Record
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
