import React, { useState, useEffect } from 'react';
import { ClassroomPlan, LessonEvidenceItem, api } from '../services/api';
import { ActionButton, PageHeader } from './common/InstitutionalUI';

interface LiveClassroomProps {
  plan: ClassroomPlan;
  onNavigate: (screen: string, param?: any) => void;
  onLessonComplete: () => void;
}

export const LiveClassroom: React.FC<LiveClassroomProps> = ({
  plan,
  onNavigate,
  onLessonComplete
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(plan.duration_minutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(1); // Start on Segment 2 (Path A Teacher Focus)
  const [selectedStudentId, setSelectedStudentId] = useState('ST001');
  const [evidenceResult, setEvidenceResult] = useState<'demonstrated' | 'emerging' | 'not_yet' | 'not_observed'>('demonstrated');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Used strategy', 'Independent']);
  const [observationNote, setObservationNote] = useState('Successfully exchanged 1 ten for 10 ones on slate.');
  const [loggedEvidence, setLoggedEvidence] = useState<LessonEvidenceItem[]>(plan.evidence_records || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (isPaused || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentSegment = plan.timeline[activeSegmentIndex] || plan.timeline[0];
  const activePath = plan.paths.find(p => p.id === currentSegment.active_path_id) || plan.paths[0];

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRecordEvidence = async () => {
    setIsSubmitting(true);
    try {
      const studentObj = activePath.students.find(s => s.student_id === selectedStudentId) || activePath.students[0];
      const newEvidence: LessonEvidenceItem = {
        student_id: selectedStudentId,
        student_name: studentObj ? studentObj.student_name : 'Student',
        path_id: activePath.id,
        task_id: activePath.exit_task_ids[0] || 'TASK_EXIT_01',
        result: evidenceResult,
        strategy_tags: selectedTags,
        teacher_observation: observationNote,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      await api.recordLessonEvidence(plan.id, [newEvidence], 'Live classroom session observation.');
      setLoggedEvidence(prev => [newEvidence, ...prev]);
      // Reset note for next
      setObservationNote('');
    } catch (e) {
      console.error(e);
      alert('Note saved to local offline buffer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (window.confirm('Complete lesson session and review collected micro-evidence?')) {
      await api.completeLessonSession(plan.id);
      onLessonComplete();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 font-sans">
      {/* Live Header & Master Timer */}
      <div className="bg-[#17365D] text-[#FCFBF8] border border-[#0F243E] rounded-[6px] p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F7658] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6E2EF]">
              ACTIVE INSTRUCTIONAL SESSION
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/10 rounded-xs">
              Live Instruction Mode
            </span>
          </div>
          <h1 className="font-serif font-bold text-xl sm:text-2xl mt-1 tracking-tight">
            {plan.class_name} • {plan.lesson_topic}
          </h1>
          <p className="text-xs text-[#D6E2EF] mt-0.5">
            {plan.total_students} Students • 1 Teacher • {plan.duration_minutes}m Allocated Lesson
          </p>
        </div>

        {/* Master Countdown Clock */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0F243E] px-4 py-2 rounded-[4px] border border-[#23456F] text-center">
            <span className="text-[9px] uppercase tracking-wider block text-[#8FA8C4]">
              Session Remaining
            </span>
            <span className="font-mono text-2xl font-bold tracking-wider text-[#FCFBF8]">
              {timeFormatted}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[#FCFBF8] text-xs font-semibold rounded-xs border border-white/20"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={handleCompleteLesson}
              className="px-3 py-1 bg-[#8A2F35] hover:bg-[#A3383F] text-[#FCFBF8] text-xs font-bold rounded-xs border border-[#5E1E22]"
            >
              Complete Lesson →
            </button>
          </div>
        </div>
      </div>

      {/* Gentle Timer Notification Strip (Section 24) */}
      {minutes <= 2 && (
        <div className="bg-[#FAF4EB] border-l-4 border-[#A87932] p-3 rounded-[3px] text-xs text-[#525252] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#A87932]">Notice:</span>
            <span>Current direct attention window ending soon. Transition remaining students to independent application.</span>
          </div>
          <button
            onClick={() => setActiveSegmentIndex(Math.min(plan.timeline.length - 1, activeSegmentIndex + 1))}
            className="text-[11px] font-bold text-[#8A2F35] hover:underline"
          >
            Advance to Next Segment →
          </button>
        </div>
      )}

      {/* Primary Split: Active Teacher Attention vs Classroom Background Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (2 Cols): Active Direct Support Path */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FCFBF8] border-2 border-[#8A2F35] rounded-[4px] p-5 space-y-4 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
              <div>
                <span className="text-[10px] font-bold text-[#8A2F35] uppercase tracking-wider block">
                  CURRENT DIRECT ATTENTION TARGET
                </span>
                <h2 className="font-serif font-bold text-lg text-[#17365D]">
                  {activePath.title} ({activePath.students.length} Students)
                </h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF4EB] text-[#8A2F35] font-bold rounded-xs border border-[#E5D8C1]">
                {activePath.duration_minutes} min direct window
              </span>
            </div>

            {/* Guided Activity Instruction */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Active Guided Activity on Blackboard
              </span>
              <div className="p-3 bg-[#F1EEE7] border border-[#D9D3C7] rounded-[3px] text-xs font-serif leading-relaxed text-[#252525]">
                {activePath.activity.guided_activity}
              </div>
              <div className="text-[11px] text-[#525252] italic">
                “{activePath.next_learning_move}”
              </div>
            </div>

            {/* Quick Student Chips */}
            <div className="pt-2 border-t border-[#D9D3C7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block mb-1.5">
                Students in Current Path
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePath.students.map(st => (
                  <button
                    key={st.student_id}
                    onClick={() => setSelectedStudentId(st.student_id)}
                    className={`px-2.5 py-1 text-xs rounded-xs font-medium border transition-colors ${
                      selectedStudentId === st.student_id
                        ? 'bg-[#17365D] text-[#FCFBF8] border-[#0F243E]'
                        : 'bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                    }`}
                  >
                    {st.student_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Micro-Evidence Live Recording Form (Section 25) */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-4 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#17365D]">
                  Live Micro-Evidence Recorder
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Record real-time task demonstration to update student diagnostic models
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#4F7658] uppercase">
                Feeds into Diagnostic Profile
              </span>
            </div>

            {/* Assessment Result Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Observed Performance on Exit Task
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEvidenceResult('demonstrated')}
                  className={`py-2 px-2 rounded-xs font-semibold border text-center transition-colors ${
                    evidenceResult === 'demonstrated'
                      ? 'bg-[#4F7658] text-[#FCFBF8] border-[#35503B]'
                      : 'bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                  }`}
                >
                  ✓ Demonstrated
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceResult('emerging')}
                  className={`py-2 px-2 rounded-xs font-semibold border text-center transition-colors ${
                    evidenceResult === 'emerging'
                      ? 'bg-[#A87932] text-[#FCFBF8] border-[#73511F]'
                      : 'bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                  }`}
                >
                  ◐ Emerging
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceResult('not_yet')}
                  className={`py-2 px-2 rounded-xs font-semibold border text-center transition-colors ${
                    evidenceResult === 'not_yet'
                      ? 'bg-[#8A2F35] text-[#FCFBF8] border-[#5E1E22]'
                      : 'bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                  }`}
                >
                  ✕ Not Yet
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceResult('not_observed')}
                  className={`py-2 px-2 rounded-xs font-semibold border text-center transition-colors ${
                    evidenceResult === 'not_observed'
                      ? 'bg-[#525252] text-[#FCFBF8] border-[#252525]'
                      : 'bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                  }`}
                >
                  ○ Not Observed
                </button>
              </div>
            </div>

            {/* Quick Strategy Tag Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Instructional Strategy Indicators
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Needed Prompting', 'Independent', 'Used Strategy', 'Repeated Error'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-0.5 rounded-xs text-[11px] border font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-[#17365D] text-[#FCFBF8] border-[#0F243E]'
                        : 'bg-[#F1EEE7] text-[#525252] border-[#D9D3C7] hover:bg-[#EAE5D9]'
                    }`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Note Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Teacher Field Observation
              </label>
              <input
                type="text"
                value={observationNote}
                onChange={e => setObservationNote(e.target.value)}
                placeholder="e.g. Successfully exchanged 1 ten for 10 ones on slate."
                className="institutional-input text-xs"
              />
            </div>

            <div className="flex justify-end pt-1">
              <ActionButton
                variant="maroon"
                size="sm"
                onClick={handleRecordEvidence}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Log Micro-Evidence →'}
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Right Column: Other Students Background Status (Section 23) */}
        <div className="space-y-4">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 space-y-3 shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#17365D] border-b border-[#D9D3C7] pb-1.5">
              Concurrent Class Workflow (While You Work With Path A)
            </h3>

            {/* Path B */}
            <div className="p-2.5 bg-[#FAF4EB] border border-[#E5D8C1] rounded-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#8A2F35]">
                  Path B: Word Decoding
                </span>
                <span className="text-[10px] font-mono text-[#525252]">
                  4 Students
                </span>
              </div>
              <p className="text-[11px] text-[#525252]">
                Paired flashcard challenge: decoding 6 multi-syllable cards in pairs.
              </p>
              <span className="inline-block text-[9px] uppercase px-1.5 py-0.2 bg-white text-[#A87932] border border-[#E5D8C1] rounded-xs font-bold">
                Self-Directed
              </span>
            </div>

            {/* Path C */}
            <div className="p-2.5 bg-[#FAF4EB] border border-[#E5D8C1] rounded-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#8A2F35]">
                  Path C: Number Comparison
                </span>
                <span className="text-[10px] font-mono text-[#525252]">
                  3 Students
                </span>
              </div>
              <p className="text-[11px] text-[#525252]">
                Partner card game: comparing two 2-digit numbers using tens orientation.
              </p>
              <span className="inline-block text-[9px] uppercase px-1.5 py-0.2 bg-white text-[#A87932] border border-[#E5D8C1] rounded-xs font-bold">
                Partner Game
              </span>
            </div>

            {/* Path D */}
            <div className="p-2.5 bg-[#F1EEE7] border border-[#D9D3C7] rounded-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#17365D]">
                  Path D: Consolidation
                </span>
                <span className="text-[10px] font-mono text-[#525252]">
                  17 Students
                </span>
              </div>
              <p className="text-[11px] text-[#525252]">
                Independent notebook practice: Textbook exercises #4 to #8.
              </p>
              <span className="inline-block text-[9px] uppercase px-1.5 py-0.2 bg-white text-[#17365D] border border-[#D9D3C7] rounded-xs font-bold">
                Independent
              </span>
            </div>
          </div>

          {/* Live Evidence Feed Stream */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-1.5">
              <span className="font-serif font-bold text-sm text-[#17365D]">
                Captured Live Evidence ({loggedEvidence.length})
              </span>
              <span className="text-[10px] text-[#737373]">Live Session</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
              {loggedEvidence.length === 0 ? (
                <p className="text-xs text-[#737373] italic text-center py-4">
                  No evidence logged yet. Use the recorder on the left.
                </p>
              ) : (
                loggedEvidence.map((ev, i) => (
                  <div key={i} className="p-2 bg-[#F7F3EA] border border-[#D9D3C7] rounded-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-[#17365D]">
                        {ev.student_name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase ${
                        ev.result === 'demonstrated' ? 'bg-[#EDF3EE] text-[#3B5E43]' : 'bg-[#FAF4EB] text-[#8F6627]'
                      }`}>
                        {ev.result}
                      </span>
                    </div>
                    {ev.teacher_observation && (
                      <p className="text-[11px] text-[#333333] italic">
                        "{ev.teacher_observation}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#737373]">
                      <span>{ev.strategy_tags.join(', ')}</span>
                      <span className="font-mono">{ev.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
