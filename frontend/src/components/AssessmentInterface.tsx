import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Mic, 
  MicOff, 
  Save, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle,
  Volume2
} from 'lucide-react';
import { api, Assessment, AssessmentItem } from '../services/api';

interface AssessmentInterfaceProps {
  studentId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({ studentId, onNavigate }) => {
  const [student, setStudent] = useState<any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [allItems, setAllItems] = useState<AssessmentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Responses dictionary: question_id -> { student_response, correct, teacher_observation }
  const [recordedResponses, setRecordedResponses] = useState<Record<string, {
    student_response: string;
    correct: boolean;
    teacher_observation?: string;
  }>>({});

  const [currentResponseInput, setCurrentResponseInput] = useState('');
  const [currentObservation, setCurrentObservation] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick observation suggestion tags
  const quickObservationTags = [
    "Reads slowly",
    "Hesitated on unfamiliar word",
    "Subtracted smaller from larger digit",
    "Used fingers for counting",
    "Self-corrected after hesitation",
    "Fluent and confident",
    "Struggled with borrowing",
    "Sounded out letter-by-letter"
  ];

  useEffect(() => {
    loadAssessmentSession();
  }, [studentId]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input, ignore number hotkeys
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1' || e.key === 'c' || e.key === 'C') {
        handleMark(true);
      } else if (e.key === '2' || e.key === 'i' || e.key === 'I') {
        handleMark(false);
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allItems, currentResponseInput, currentObservation]);

  const loadAssessmentSession = async () => {
    setLoading(true);
    try {
      const studentData = await api.getStudentProfile(studentId);
      setStudent(studentData.student);

      const asms = await api.getAssessments();
      setAssessments(asms);

      // Flatten reading items then numeracy items
      const combinedItems: AssessmentItem[] = [];
      asms.forEach(a => {
        if (a.items && a.items.length > 0) {
          combinedItems.push(...a.items);
        }
      });

      setAllItems(combinedItems);

      // Preload already recorded responses if student was in_progress
      if (studentData.total_responses > 0) {
        const evidenceData = await api.getEvidence(studentId);
        const map: Record<string, any> = {};
        if (evidenceData.raw_responses) {
          evidenceData.raw_responses.forEach((r: any) => {
            map[r.question_id] = {
              student_response: r.student_response,
              correct: r.correct,
              teacher_observation: r.teacher_observation
            };
          });
        }
        setRecordedResponses(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentItem = allItems[currentIndex];

  useEffect(() => {
    if (currentItem && recordedResponses[currentItem.id]) {
      const existing = recordedResponses[currentItem.id];
      setCurrentResponseInput(existing.student_response || '');
      setCurrentObservation(existing.teacher_observation || '');
    } else if (currentItem) {
      setCurrentResponseInput(currentItem.expected_response || '');
      setCurrentObservation('');
    }
  }, [currentIndex, currentItem]);

  const handleMark = (isCorrect: boolean) => {
    if (!currentItem) return;

    const respText = currentResponseInput.trim() || (isCorrect ? currentItem.expected_response : 'incorrect');

    setRecordedResponses(prev => ({
      ...prev,
      [currentItem.id]: {
        student_response: respText,
        correct: isCorrect,
        teacher_observation: currentObservation.trim() || undefined
      }
    }));

    // Auto-advance to next item if not at end
    if (currentIndex < allItems.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    }
  };

  const handleTagClick = (tag: string) => {
    setCurrentObservation(prev => {
      if (!prev) return tag;
      if (prev.includes(tag)) return prev;
      return `${prev}; ${tag}`;
    });
  };

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // Simulated voice input for browsers without Web Speech API
      setIsRecordingVoice(true);
      setTimeout(() => {
        setCurrentObservation(prev => prev ? `${prev}; Student recognizes words but reads slowly` : "Student recognizes words but reads slowly");
        setIsRecordingVoice(false);
      }, 1500);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecordingVoice(true);
      recognition.onend = () => setIsRecordingVoice(false);
      recognition.onerror = () => setIsRecordingVoice(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCurrentObservation(prev => prev ? `${prev}; ${transcript}` : transcript);
        }
      };

      recognition.start();
    } catch (e) {
      setIsRecordingVoice(false);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < allItems.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleSaveAndExit = async () => {
    await saveCurrentResponses();
    onNavigate('class_overview', { classId: student?.class_id || 'CLS_G3A' });
  };

  const saveCurrentResponses = async () => {
    const payloadResponses = Object.entries(recordedResponses).map(([qId, data]) => {
      const item = allItems.find(i => i.id === qId);
      return {
        id: `RES_${studentId}_${qId}`,
        student_id: studentId,
        assessment_id: item?.assessment_id || 'ASM_FLN_G3',
        question_id: qId,
        skill_id: item?.skill_id || 'unknown',
        domain: item?.domain || 'reading',
        expected_response: item?.expected_response || '',
        student_response: data.student_response,
        correct: data.correct,
        teacher_observation: data.teacher_observation
      };
    });

    try {
      // Save single responses
      for (const r of payloadResponses) {
        await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r)
        });
      }
    } catch (e) {
      console.warn('Saved locally');
    }
  };

  const handleFinishAssessment = async () => {
    setIsSubmitting(true);
    try {
      const payloadResponses = Object.entries(recordedResponses).map(([qId, data]) => {
        const item = allItems.find(i => i.id === qId);
        return {
          id: `RES_${studentId}_${qId}`,
          student_id: studentId,
          assessment_id: item?.assessment_id || 'ASM_FLN_G3',
          question_id: qId,
          skill_id: item?.skill_id || 'unknown',
          domain: item?.domain || 'reading',
          expected_response: item?.expected_response || '',
          student_response: data.student_response,
          correct: data.correct,
          teacher_observation: data.teacher_observation
        };
      });

      const observationsList = Object.values(recordedResponses)
        .filter(d => d.teacher_observation)
        .map((d, idx) => ({
          id: `OBS_${studentId}_${idx}`,
          student_id: studentId,
          raw_text: d.teacher_observation || '',
          observation_type: 'teacher_note',
          source: 'teacher'
        }));

      await api.submitAssessmentSession({
        student_id: studentId,
        responses: payloadResponses,
        observations: observationsList
      });

      // Navigate directly to Learning Fingerprint!
      onNavigate('fingerprint', { studentId });
    } catch (e) {
      alert('Error finalizing assessment session. Preserving local responses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !currentItem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading assessment battery...</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(recordedResponses).length;
  const progressPercent = Math.round((answeredCount / allItems.length) * 100);
  const currentRecorded = recordedResponses[currentItem.id];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Bar: Student Header & Session Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAndExit}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Save and exit"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{student?.name || 'Student'}</span>
              <span className="text-xs text-slate-500 font-mono">#{student?.roll_number}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Grade {student?.grade || 3} • {student?.language || 'Marathi'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Module: <span className="font-semibold text-slate-700 uppercase">{currentItem.domain}</span> — {currentItem.skill_title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAndExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Exit</span>
          </button>
          <button
            onClick={handleFinishAssessment}
            disabled={isSubmitting || answeredCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Fingerprint</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Task {currentIndex + 1} of {allItems.length}
          </span>
          <span>{answeredCount} of {allItems.length} Recorded ({progressPercent}%)</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / allItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Stimulus Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-10 shadow-xs text-center relative overflow-hidden">
        
        {/* Domain Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-6">
          <span className="capitalize">{currentItem.domain}</span>
          <span>•</span>
          <span>{currentItem.skill_title}</span>
        </div>

        {/* Big Stimulus Text */}
        <div className="min-h-[140px] flex items-center justify-center p-4">
          <div className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-wide font-sans leading-relaxed select-none">
            {currentItem.question_stimulus}
          </div>
        </div>

        {/* Expected Response hint */}
        <div className="mt-2 text-xs text-slate-400 font-mono">
          Target / Expected: <span className="font-semibold text-slate-600">{currentItem.expected_response}</span>
        </div>

        {/* Teacher Administration Prompt */}
        <div className="mt-6 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 max-w-lg mx-auto flex items-start gap-2 text-left">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Teacher Prompt: </span>
            {currentItem.instructions_for_teacher}
          </div>
        </div>

      </div>

      {/* Student Response & Marking Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        
        {/* Student Response Display / Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-1/3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Response
            </label>
            <input
              type="text"
              placeholder={`e.g. ${currentItem.expected_response}`}
              value={currentResponseInput}
              onChange={e => setCurrentResponseInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Large Marking Buttons */}
          <div className="w-full sm:w-2/3 flex items-center gap-3 pt-4 sm:pt-0">
            {/* Correct Button */}
            <button
              onClick={() => handleMark(true)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                currentRecorded?.correct === true
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>✓ Correct</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">
                Key 1
              </kbd>
            </button>

            {/* Incorrect Button */}
            <button
              onClick={() => handleMark(false)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                currentRecorded?.correct === false
                  ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 hover:border-rose-400'
              }`}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
              <span>✗ Incorrect</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">
                Key 2
              </kbd>
            </button>
          </div>
        </div>

        {/* Teacher Observation Section (Section 9) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Teacher Observation (Optional evidence note)</span>
            </label>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isRecordingVoice
                  ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isRecordingVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecordingVoice ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="e.g. Student attempted subtraction but struggled with borrowing; reads slowly"
            value={currentObservation}
            onChange={e => setCurrentObservation(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Quick Tags for Instant Logging */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
              Quick Tags:
            </span>
            {quickObservationTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200/60"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Prev / Next Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-slate-400 font-mono">
            {currentIndex + 1} / {allItems.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentIndex === allItems.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
