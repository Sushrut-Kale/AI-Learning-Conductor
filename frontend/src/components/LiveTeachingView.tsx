import React, { useState, useEffect } from 'react';
import { api, InterventionSession, InterventionEvidence } from '../services/api';

interface LiveTeachingViewProps {
  sessionId?: string;
  studentId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

interface StudentMicroState {
  id: string;
  name: string;
  status: 'demonstrated' | 'emerging' | 'not_demonstrated' | 'not_observed';
  chips: string[];
}

export const LiveTeachingView: React.FC<LiveTeachingViewProps> = ({
  sessionId = 'INT_ST001_SUB',
  studentId = 'ST001',
  onNavigate
}) => {
  const [session, setSession] = useState<InterventionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(462); // 07:42 in seconds
  const [currentStep, setCurrentStep] = useState(2); // 1: Model, 2: Guided Practice, 3: Independent, 4: Exit Check

  // Micro-evidence roster for the 6 students in Path A
  const [students, setStudents] = useState<StudentMicroState[]>([
    { id: 'ST001', name: 'Aarav Sharma', status: 'demonstrated', chips: ['+ Independent', '+ Used target strategy'] },
    { id: 'ST003', name: 'Rohan Patil', status: 'demonstrated', chips: ['+ Used target strategy'] },
    { id: 'ST005', name: 'Ishaan Kulkarni', status: 'demonstrated', chips: ['+ Independent', '+ Completed accurately'] },
    { id: 'ST007', name: 'Pooja Jadhav', status: 'emerging', chips: ['+ Needed prompting'] },
    { id: 'ST009', name: 'Tanvi Shinde', status: 'emerging', chips: ['+ Needed prompting', '+ Required teacher modelling'] },
    { id: 'ST011', name: 'Aditya More', status: 'not_observed', chips: [] },
  ]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('Initially needed prompting, then independently exchanged one ten.');
  const [recordingNote, setRecordingNote] = useState('');

  // Multimodal state
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workSampleConfirmed, setWorkSampleConfirmed] = useState(false);
  const [isAnalyzingWork, setIsAnalyzingWork] = useState(false);

  // Post Check Tasks
  const [postTasks, setPostTasks] = useState([
    { id: 'P1', prompt: '43 - 17', studentAnswer: '26', expectedAnswer: '26', correct: true, strategy: true },
    { id: 'P2', prompt: '52 - 28', studentAnswer: '24', expectedAnswer: '24', correct: true, strategy: true },
    { id: 'P3', prompt: '61 - 35', studentAnswer: '26', expectedAnswer: '26', correct: true, strategy: true },
    { id: 'P4', prompt: '70 - 44', studentAnswer: '26', expectedAnswer: '26', correct: true, strategy: true },
    { id: 'P5', prompt: '84 - 49', studentAnswer: '34', expectedAnswer: '35', correct: false, strategy: false },
  ]);

  // Copilot active signal
  const [copilotSignal, setCopilotSignal] = useState<'continue' | 'example' | 'prereq' | 'note'>('continue');
  const [copilotNotice, setCopilotNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId, studentId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      let data: InterventionSession;
      if (sessionId) {
        data = await api.getInterventionSession(sessionId);
      } else {
        data = await api.getStudentIntervention(studentId);
      }
      setSession(data);
      if (data.current_step_index) {
        setCurrentStep(data.current_step_index);
      }
    } catch (e) {
      console.error('Error loading session', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStepChange = async (step: number) => {
    if (!session) return;
    const bounded = Math.max(1, Math.min(4, step));
    setCurrentStep(bounded);
    try {
      await api.advanceInterventionStep(session.id, bounded);
    } catch (e) {
      console.warn('Step update saved locally');
    }
  };

  const updateStudentStatus = (studId: string, status: StudentMicroState['status']) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studId ? { ...s, status } : s))
    );
  };

  const toggleStudentChip = (studId: string, chip: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studId) return s;
        const exists = s.chips.includes(chip);
        const chips = exists ? s.chips.filter((c) => c !== chip) : [...s.chips, chip];
        return { ...s, chips };
      })
    );
  };

  // Voice recording simulation / capture
  const handleToggleVoice = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // simulate transcription after 2 seconds
      setTimeout(() => {
        setIsRecording(false);
        setRecordingNote(voiceText);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSaveVoiceObservation = async () => {
    if (!session || !recordingNote) return;
    try {
      const updated = await api.recordInterventionObservation(session.id, recordingNote, 'voice');
      setSession(updated);
      setRecordingNote('');
      alert('Voice observation structured and stored in intervention evidence record.');
    } catch (e) {
      console.error(e);
      alert('Observation recorded locally.');
    }
  };

  const handleConfirmWorkSample = async () => {
    if (!session) return;
    setIsAnalyzingWork(true);
    try {
      const updated = await api.recordInterventionMultimodal(
        session.id,
        'aarav_slate_43_minus_17.png',
        'slate'
      );
      setSession(updated);
      setWorkSampleConfirmed(true);
      setShowWorkModal(false);
      alert('Multimodal student slate work verified and incorporated into evidence stream.');
    } catch (e) {
      console.error(e);
      setWorkSampleConfirmed(true);
      setShowWorkModal(false);
    } finally {
      setIsAnalyzingWork(false);
    }
  };

  const toggleTaskCorrect = (index: number) => {
    setPostTasks((prev) =>
      prev.map((t, idx) => {
        if (idx !== index) return t;
        const nextCorrect = !t.correct;
        return {
          ...t,
          correct: nextCorrect,
          strategy: nextCorrect
        };
      })
    );
  };

  const handleCalculatePostCheck = async () => {
    if (!session) return;
    const items: InterventionEvidence[] = postTasks.map((t) => ({
      id: `EV_POST_${t.id}_${Date.now()}`,
      task_id: t.id,
      task_prompt: t.prompt,
      student_response: t.studentAnswer,
      expected_response: t.expectedAnswer,
      correct: t.correct,
      target_strategy_used: t.strategy,
      source: 'post_check'
    }));

    try {
      await api.recordInterventionPostCheck(session.id, items);
      onNavigate('intervention_review', { sessionId: session.id, studentId: session.student_id });
    } catch (e) {
      console.error('Post-check calculation error', e);
      onNavigate('intervention_review', { sessionId: session.id, studentId: session.student_id });
    }
  };

  const STEPS = [
    { num: 1, title: 'Model', desc: 'Teacher demonstrates 4 tens & 3 ones exchange with sticks.' },
    { num: 2, title: 'Guided Practice', desc: 'Students represent 43 as 4 tens and 3 ones and exchange one ten.' },
    { num: 3, title: 'Independent Attempt', desc: 'Students execute 52 - 28 and 61 - 35 individually on slates.' },
    { num: 4, title: 'Exit Check', desc: 'Quick 5-item post-intervention diagnostic check.' }
  ];

  const QUICK_CHIPS = [
    '+ Independent',
    '+ Needed prompting',
    '+ Used target strategy',
    '+ Repeated previous error',
    '+ Tried alternative strategy',
    '+ Explained reasoning',
    '+ Completed accurately',
    '+ Required teacher modelling'
  ];

  if (loading || !session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-[#666666]">
        Initializing live teaching instructional environment...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-[#252525]">
      
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-3">
        <div className="flex items-center gap-2 text-xs font-sans text-[#666666]">
          <button 
            onClick={() => onNavigate('teach_and_adapt', { classId: session.class_id })}
            className="hover:text-[#17365D] hover:underline"
          >
            ← Teach & Adapt Overview
          </button>
          <span>/</span>
          <span className="font-semibold text-[#17365D]">Live Teaching Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EEF4EF] text-[#4F7658] border border-[#CADBCE] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#4F7658] animate-pulse"></span>
            LIVE SESSION ACTIVE
          </span>
          <button
            onClick={() => onNavigate('intervention_review', { sessionId: session.id, studentId: session.student_id })}
            className="px-3 py-1 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E]"
          >
            Go to Review →
          </button>
        </div>
      </div>

      {/* Live Teaching Header (Section 5) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35]">
              Instructional Path A
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#17365D] tracking-tight">
              Regrouping Foundation
            </h1>
            <div className="flex items-center gap-4 text-xs text-[#555555] font-sans mt-1">
              <span>Students: <strong className="text-[#17365D]">6</strong></span>
              <span>•</span>
              <span>Learning Focus: <strong className="text-[#17365D]">Regrouping (Place-Value Exchange)</strong></span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-[#FAF4EB] border border-[#E5D8C1] text-[#A87932] font-semibold">
                Teacher Attention: Required
              </span>
            </div>
          </div>

          {/* Time Remaining Timer */}
          <div className="bg-[#17365D] text-white px-5 py-3 text-center border border-[#0F243E]">
            <div className="text-[10px] font-sans uppercase tracking-wider text-[#D6E2EF]">
              Time Remaining
            </div>
            <div className="font-mono text-2xl font-bold tracking-wider mt-0.5">
              {formatTimer(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Teaching Sequence Progress (Section 5) */}
        <div className="mt-6 pt-4 border-t border-[#EBE6DC]">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666] mb-2">
            Teaching Sequence
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {STEPS.map((s) => (
              <button
                key={s.num}
                onClick={() => handleStepChange(s.num)}
                className={`p-3 text-left border transition-all ${
                  currentStep === s.num
                    ? 'bg-[#17365D] text-white border-[#0F243E] shadow-xs'
                    : currentStep > s.num
                    ? 'bg-[#EEF4EF] text-[#4F7658] border-[#CADBCE]'
                    : 'bg-[#FCFBF8] text-[#555555] border-[#D9D3C7] hover:bg-[#F7F3EA]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  Step {s.num} {currentStep > s.num && '✓'}
                </div>
                <div className="font-serif font-bold text-sm mt-0.5">
                  {s.title}
                </div>
                <div className={`text-[11px] mt-1 line-clamp-2 ${currentStep === s.num ? 'text-[#D6E2EF]' : 'text-[#737373]'}`}>
                  {s.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Step Active Card */}
        <div className="mt-4 p-4 bg-[#FAF4EB] border border-[#E5D8C1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#A87932]">
              Current Step Prompt — {STEPS[currentStep - 1].title}
            </div>
            <div className="font-serif text-base font-bold text-[#17365D] mt-1">
              "Represent 43 as 4 tens and 3 ones. Exchange one ten for ten ones."
            </div>
            <div className="text-xs text-[#666666] mt-0.5">
              Target strategy: Decompose 1 bundle of 10 into 10 loose units before subtracting 7 ones.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleStepChange(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-3 py-1.5 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#555555] disabled:opacity-40"
            >
              [ Previous ]
            </button>
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={currentStep === 4}
              className="px-4 py-1.5 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] disabled:opacity-40"
            >
              [ Complete Step ]
            </button>
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              className="px-3 py-1.5 bg-transparent border border-dashed border-[#A87932] text-xs text-[#A87932] hover:bg-[#FAF4EB]"
            >
              [ Skip ]
            </button>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Micro Evidence & Teacher Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: 2 Columns for Micro-Evidence Collection (Section 8) */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
              <div>
                <h2 className="font-serif font-bold text-base text-[#17365D]">
                  Micro-Evidence Collection — Student Roster
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Record real-time task demonstration with 1-click markers and observation chips.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleVoice}
                  className={`px-3 py-1.5 text-xs font-medium border flex items-center gap-1.5 ${
                    isRecording 
                      ? 'bg-[#8A2F35] text-white border-[#6D2328] animate-pulse'
                      : 'bg-[#FCFBF8] text-[#8A2F35] border-[#D9C7BE] hover:bg-[#FAF4EB]'
                  }`}
                >
                  <span>🎙</span>
                  <span>{isRecording ? 'Listening...' : 'Record Voice Observation'}</span>
                </button>

                <button
                  onClick={() => setShowWorkModal(true)}
                  className="px-3 py-1.5 bg-[#FCFBF8] text-[#17365D] border border-[#C5D3E3] hover:bg-[#EAEFF5] text-xs font-medium flex items-center gap-1"
                >
                  <span>📷</span>
                  <span>Add Work Sample</span>
                </button>
              </div>
            </div>

            {/* Voice Transcribed Note Bar (Section 9 & 31) */}
            {recordingNote && (
              <div className="mb-4 p-3 bg-[#EEF4EF] border border-[#CADBCE] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#4F7658]">
                  <span>AI Structured Voice Observation:</span>
                  <span className="font-mono text-[10px] text-[#666666]">Teacher Audio Captured</span>
                </div>
                <div className="font-serif italic text-xs text-[#252525]">
                  "{recordingNote}"
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#4F7658]">
                    Terminal Status: <strong>Demonstrated (Independent Strategy Use)</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecordingNote('')}
                      className="text-xs text-[#666666] hover:underline"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSaveVoiceObservation}
                      className="px-3 py-0.5 bg-[#4F7658] text-white text-xs font-medium"
                    >
                      Confirm & Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Roster Items */}
            <div className="divide-y divide-[#EBE6DC]">
              {students.map((st) => (
                <div key={st.id} className="py-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#8A2F35]">{st.id}</span>
                      <span className="font-serif font-bold text-sm text-[#17365D]">{st.name}</span>
                      {st.id === 'ST001' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#8A2F35] text-white">
                          Primary Focus
                        </span>
                      )}
                    </div>

                    {/* Demonstration 4 State Toggle (Section 8) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStudentStatus(st.id, 'demonstrated')}
                        className={`px-2 py-1 text-xs font-sans font-medium border ${
                          st.status === 'demonstrated'
                            ? 'bg-[#4F7658] text-white border-[#3F5E46]'
                            : 'bg-[#FCFBF8] text-[#4F7658] border-[#CADBCE] hover:bg-[#EEF4EF]'
                        }`}
                        title="Demonstrated"
                      >
                        ✓ Demonstrated
                      </button>
                      <button
                        onClick={() => updateStudentStatus(st.id, 'emerging')}
                        className={`px-2 py-1 text-xs font-sans font-medium border ${
                          st.status === 'emerging'
                            ? 'bg-[#A87932] text-white border-[#875F24]'
                            : 'bg-[#FCFBF8] text-[#A87932] border-[#E5D8C1] hover:bg-[#FAF4EB]'
                        }`}
                        title="Emerging"
                      >
                        ◐ Emerging
                      </button>
                      <button
                        onClick={() => updateStudentStatus(st.id, 'not_demonstrated')}
                        className={`px-2 py-1 text-xs font-sans font-medium border ${
                          st.status === 'not_demonstrated'
                            ? 'bg-[#8A2F35] text-white border-[#6D2328]'
                            : 'bg-[#FCFBF8] text-[#8A2F35] border-[#D9C7BE] hover:bg-[#F2EDEA]'
                        }`}
                        title="Not demonstrated"
                      >
                        ✕ Not demonstrated
                      </button>
                      <button
                        onClick={() => updateStudentStatus(st.id, 'not_observed')}
                        className={`px-2 py-1 text-xs font-sans font-medium border ${
                          st.status === 'not_observed'
                            ? 'bg-[#666666] text-white border-[#444444]'
                            : 'bg-[#FCFBF8] text-[#666666] border-[#D9D3C7] hover:bg-[#F1EEE7]'
                        }`}
                        title="Not observed"
                      >
                        ○ Not observed
                      </button>
                    </div>
                  </div>

                  {/* Micro Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-16">
                    {QUICK_CHIPS.map((chip) => {
                      const active = st.chips.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleStudentChip(st.id, chip)}
                          className={`text-[10px] font-sans px-2 py-0.5 border rounded-none transition-colors ${
                            active
                              ? 'bg-[#17365D] text-white border-[#0F243E]'
                              : 'bg-[#FCFBF8] text-[#555555] border-[#D9D3C7] hover:border-[#17365D]'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Post-Check Exit Task Assessment (Section 12, 23) */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-5">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#17365D]">
                  Post-Check Assessment: {session.student_name} (Aarav Sharma)
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Evaluate 5 tasks after the intervention to compare with baseline (2 / 5).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#4F7658]">
                  Post: {postTasks.filter(t => t.correct).length} / {postTasks.length} Correct ({Math.round((postTasks.filter(t => t.correct).length / postTasks.length) * 100)}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {postTasks.map((t, idx) => (
                <div 
                  key={t.id}
                  onClick={() => toggleTaskCorrect(idx)}
                  className={`p-2.5 border cursor-pointer select-none transition-all ${
                    t.correct 
                      ? 'bg-[#EEF4EF] border-[#CADBCE] text-[#4F7658]'
                      : 'bg-[#F2EDEA] border-[#D9C7BE] text-[#8A2F35]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                    <span>Task {idx + 1}</span>
                    <span>{t.correct ? '✓ Correct' : '✕ Error'}</span>
                  </div>
                  <div className="font-serif font-bold text-base mt-1 text-[#252525]">
                    {t.prompt}
                  </div>
                  <div className="text-[11px] text-[#555555] mt-0.5">
                    Ans: <strong>{t.studentAnswer}</strong>
                  </div>
                  <div className="text-[10px] text-[#737373] mt-1">
                    Exchange: {t.strategy ? 'Independent' : 'Incomplete'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EBE6DC] flex items-center justify-between">
              <div className="text-xs text-[#555555]">
                Baseline: <strong className="text-[#8A2F35]">40%</strong> → Post-Check: <strong className="text-[#4F7658]">{Math.round((postTasks.filter(t => t.correct).length / postTasks.length) * 100)}%</strong> (+40 points)
              </div>
              <button
                onClick={handleCalculatePostCheck}
                className="px-4 py-2 bg-[#17365D] text-white text-xs font-medium hover:bg-[#0F243E] transition-colors"
              >
                Calculate Intervention Response & Adapt →
              </button>
            </div>
          </div>

        </div>

        {/* Right: Teacher Copilot (Section 6 & 7) */}
        <div className="space-y-4">
          
          <div className="bg-[#FCFBF8] border-2 border-[#17365D] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#17365D]"></span>
                <h3 className="font-serif font-bold text-sm text-[#17365D] tracking-wide uppercase">
                  Teacher Copilot
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8A2F35] font-bold">
                Contextual Action Panel
              </span>
            </div>

            {/* Current Signal (Section 6) */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF4EB] border-l-4 border-[#A87932] p-3">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#A87932]">
                  Current Signal
                </div>
                <div className="font-serif font-bold text-xs text-[#252525] mt-1">
                  3 of 6 students have completed the first guided task independently.
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
                  Suggested Action:
                </div>
                <div className="font-serif font-bold text-sm text-[#17365D] mt-0.5">
                  Continue with independent attempt.
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
                  Reason:
                </div>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                  Current evidence indicates the target strategy is being demonstrated by most students in this path.
                </p>
              </div>

              {/* Copilot Action Buttons (Section 6) */}
              <div className="pt-3 border-t border-[#EBE6DC] space-y-2">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#666666]">
                  Recommended Moves:
                </div>
                
                <button
                  onClick={() => {
                    setCopilotSignal('continue');
                    handleStepChange(3);
                    setCopilotNotice('Advancing path to Independent Attempt step.');
                  }}
                  className="w-full py-2 px-3 bg-[#17365D] text-white text-xs font-medium text-left hover:bg-[#0F243E] transition-colors flex items-center justify-between"
                >
                  <span>[ Continue ]</span>
                  <span className="text-[10px] text-[#A6C0DE]">Advance to Step 3</span>
                </button>

                <button
                  onClick={() => {
                    setCopilotSignal('example');
                    setCopilotNotice('Providing secondary example: 54 - 28 with base-10 flats.');
                  }}
                  className="w-full py-2 px-3 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#252525] text-left hover:bg-[#F7F3EA] transition-colors flex items-center justify-between"
                >
                  <span>[ Give Another Example ]</span>
                  <span className="text-[10px] text-[#666666]">Secondary Pair</span>
                </button>

                <button
                  onClick={() => {
                    setCopilotSignal('prereq');
                    setCopilotNotice('Checking place-value exchange prerequisite (tens decomposition).');
                  }}
                  className="w-full py-2 px-3 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#252525] text-left hover:bg-[#F7F3EA] transition-colors flex items-center justify-between"
                >
                  <span>[ Check Prerequisite ]</span>
                  <span className="text-[10px] text-[#666666]">Decomposition check</span>
                </button>

                <button
                  onClick={handleToggleVoice}
                  className="w-full py-2 px-3 bg-[#FCFBF8] border border-[#D9D3C7] text-xs font-medium text-[#8A2F35] text-left hover:bg-[#FAF4EB] transition-colors flex items-center justify-between"
                >
                  <span>[ Record Observation ]</span>
                  <span className="text-[10px] text-[#8A2F35]">Voice / Text note</span>
                </button>
              </div>

              {copilotNotice && (
                <div className="p-2 bg-[#EEF4EF] border border-[#CADBCE] text-[11px] text-[#4F7658] font-medium">
                  ✓ {copilotNotice}
                </div>
              )}

              {/* Adaptive Signal Conditions (Section 7) */}
              <div className="pt-3 border-t border-[#EBE6DC] text-[10px] text-[#737373] space-y-1">
                <div className="font-bold text-[#666666] uppercase">Adaptive Signal Guidelines:</div>
                <p>• Most students demonstrating target → Continue</p>
                <p>• Several students struggling → Give another example</p>
                <p>• Same error recurring → Investigate prerequisite</p>
                <p>• Evidence insufficient → Collect additional observations</p>
              </div>

            </div>
          </div>

          {/* Multimodal Verification Status Tile (Section 10, 11) */}
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-[#17365D]">
              <span>Multimodal Evidence Tile</span>
              <span className="text-[10px] font-mono text-[#4F7658]">
                {workSampleConfirmed ? '✓ Attached' : 'Optional'}
              </span>
            </div>
            <p className="text-[#666666] text-[11px]">
              {workSampleConfirmed
                ? 'Student slate photograph verified: 43 - 17 = 26 with intermediate place-value strikeout.'
                : 'Attach camera/notebook work sample to substantiate qualitative observation.'}
            </p>
            {!workSampleConfirmed && (
              <button
                onClick={() => setShowWorkModal(true)}
                className="w-full py-1.5 border border-[#D9D3C7] text-xs text-[#17365D] hover:bg-[#F7F3EA]"
              >
                Inspect Student Slate Photo
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Multimodal Inspection Modal (Section 10, 11, 29, 32) */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[#FCFBF8] border border-[#D9D3C7] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2">
              <h3 className="font-serif font-bold text-base text-[#17365D]">
                Multimodal Evidence Inspection — Student Slate
              </h3>
              <button onClick={() => setShowWorkModal(false)} className="text-xs text-[#666666]">
                ✕
              </button>
            </div>

            {/* Slate Preview Artifact */}
            <div className="bg-[#17222B] text-[#FCFBF8] font-mono p-5 text-center border-4 border-[#8B7355] rounded-xs shadow-inner">
              <div className="text-[10px] text-[#A6C0DE] uppercase tracking-wider mb-2">
                Aarav Sharma — Slate Work Photo
              </div>
              <div className="text-2xl font-serif tracking-widest text-[#FFF8DC]">
                <div className="text-sm line-through text-[#FF9999] opacity-70">4 3</div>
                <div>3 [13]</div>
                <div className="border-b border-[#FFF8DC] my-1">- 1 7</div>
                <div className="font-bold text-3xl text-[#90EE90]">2 6</div>
              </div>
              <div className="text-[10px] text-[#CADBCE] mt-3">
                Visible Strikeout: 4 crossed out, replaced with 3 tens & 13 ones.
              </div>
            </div>

            {/* AI Vision Extraction (Section 10 & 11) */}
            <div className="bg-[#F7F3EA] border border-[#D9D3C7] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#17365D] uppercase text-[10px]">
                  Observed Work (Vision Model Extraction)
                </span>
                <span className="px-1.5 py-0.2 bg-[#EEF4EF] text-[#4F7658] border border-[#CADBCE] text-[10px] font-bold">
                  Evidence Confidence: High
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-[#666666]">Visible Task: </span>
                  <strong>43 - 17</strong>
                </div>
                <div>
                  <span className="text-[#666666]">Written Answer: </span>
                  <strong>26</strong>
                </div>
                <div>
                  <span className="text-[#666666]">Regrouping: </span>
                  <strong className="text-[#4F7658]">Visible (Tens strikeout)</strong>
                </div>
                <div>
                  <span className="text-[#666666]">Intermediate Representation: </span>
                  <strong>Present (13 ones)</strong>
                </div>
              </div>
              <p className="text-[11px] text-[#555555] italic pt-1">
                "Student crossed out 4 tens and represented 3 tens and 13 ones."
              </p>
            </div>

            {/* Verification Buttons (Section 32) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWorkModal(false)}
                className="px-3 py-1.5 border border-[#D9D3C7] text-xs text-[#666666]"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmWorkSample}
                disabled={isAnalyzingWork}
                className="px-4 py-1.5 bg-[#4F7658] text-white text-xs font-medium hover:bg-[#3F5E46]"
              >
                {isAnalyzingWork ? 'Verifying...' : '✓ Confirm Work Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
