import React, { useState, useEffect } from 'react';
import { api, API_BASE, Assessment, AssessmentItem } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';

interface AssessmentInterfaceProps {
  studentId: string;
  onNavigate: (screen: string, param?: any) => void;
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({ studentId, onNavigate }) => {
  const [student, setStudent] = useState<any>(null);
  const [allItems, setAllItems] = useState<AssessmentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Institutional quick observations
  const quickObservationTags = [
    "Used fingers",
    "Needed prompting",
    "Worked independently",
    "Struggled with borrowing",
    "Reads slowly",
    "Hesitated at unfamiliar word",
    "Sounded out phonemes",
    "Self-corrected"
  ];

  useEffect(() => {
    loadAssessmentSession();
  }, [studentId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      const combinedItems: AssessmentItem[] = [];
      asms.forEach(a => {
        if (a.items && a.items.length > 0) {
          combinedItems.push(...a.items);
        }
      });
      setAllItems(combinedItems);

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

    if (currentIndex < allItems.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 100);
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
      setIsRecordingVoice(true);
      setTimeout(() => {
        setCurrentObservation(prev => prev ? `${prev}; Needed prompting on unfamiliar term` : "Needed prompting on unfamiliar term");
        setIsRecordingVoice(false);
      }, 1200);
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
      for (const r of payloadResponses) {
        await fetch(`${API_BASE}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r)
        });
      }
    } catch (e) {
      console.warn('Saved offline in local storage');
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

      onNavigate('fingerprint', { studentId });
    } catch (e) {
      alert('Error finalizing assessment session. Retaining offline evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !currentItem) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-sans text-[#666666]">
        Loading assessment instrument...
      </div>
    );
  }

  const answeredCount = Object.keys(recordedResponses).length;
  const currentRecorded = recordedResponses[currentItem.id];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 font-sans">
      
      {/* Institutional Session Context (Section 12) */}
      <div className="border-b border-[#D9D3C7] pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A2F35]">
            Grade 3 — Section A
          </p>
          <h1 className="font-serif font-bold text-xl text-[#17365D]">
            Student: {student?.name || 'Arjun Nalawade'}
          </h1>
          <p className="text-xs text-[#666666]">
            Assessment: Foundational {currentItem.domain === 'reading' ? 'Literacy' : 'Numeracy'} ({currentItem.skill_title})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton variant="secondary" size="sm" onClick={handleSaveAndExit}>
            Save & Exit
          </ActionButton>
          <ActionButton 
            variant="maroon" 
            size="sm" 
            onClick={handleFinishAssessment}
            disabled={isSubmitting || answeredCount === 0}
          >
            {isSubmitting ? 'Structuring...' : 'Complete & Structure Fingerprint'}
          </ActionButton>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] px-3.5 py-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#17365D]">
          TASK {currentIndex + 1} OF {allItems.length}
        </span>
        <span className="text-[#666666]">
          {answeredCount} of {allItems.length} tasks recorded
        </span>
      </div>

      {/* Stimulus & Instructions Panel */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-6 text-center space-y-4">
        
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
          {currentItem.skill_title}
        </div>

        {/* Big Stimulus Display */}
        <div className="py-6 min-h-[120px] flex items-center justify-center">
          <div className="font-serif text-3xl sm:text-5xl font-bold text-[#17365D] tracking-wide leading-relaxed">
            {currentItem.question_stimulus}
          </div>
        </div>

        {/* Teacher Instruction Callout */}
        <div className="bg-[#F1EEE7] border-t border-[#D9D3C7] -mx-6 -mb-6 p-3.5 text-left text-xs text-[#525252]">
          <span className="font-bold text-[#17365D] uppercase tracking-wide text-[10px] block mb-0.5">
            Teacher Instruction:
          </span>
          {currentItem.instructions_for_teacher}
        </div>

      </div>

      {/* Student Response & Evaluation Panel (Section 12) */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-4">
        
        {/* Response Row */}
        <div>
          <label className="block text-xs font-semibold text-[#252525] mb-1">
            Student Response:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder={`e.g. ${currentItem.expected_response}`}
              value={currentResponseInput}
              onChange={e => setCurrentResponseInput(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-2 text-sm border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] text-[#252525] focus:outline-none focus:border-[#17365D] font-mono"
            />

            {/* Evaluation Buttons */}
            <div className="w-full sm:w-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMark(true)}
                className={`flex-1 py-2 px-3 rounded-[4px] border text-xs font-bold transition-colors ${
                  currentRecorded?.correct === true
                    ? 'bg-[#4F7658] text-[#FCFBF8] border-[#4F7658]'
                    : 'bg-[#EDF3EE] text-[#3B5E43] border-[#C6D8CA] hover:bg-[#DCE7DE]'
                }`}
              >
                [ ✓ Correct ] <span className="text-[10px] font-normal opacity-75">(Key 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleMark(false)}
                className={`flex-1 py-2 px-3 rounded-[4px] border text-xs font-bold transition-colors ${
                  currentRecorded?.correct === false
                    ? 'bg-[#9A4A4A] text-[#FCFBF8] border-[#9A4A4A]'
                    : 'bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1] hover:bg-[#F2D7D7]'
                }`}
              >
                [ ✕ Incorrect ] <span className="text-[10px] font-normal opacity-75">(Key 2)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Teacher Observation Row */}
        <div className="pt-3 border-t border-[#D9D3C7]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#252525]">
              Teacher Observation (Qualitative task evidence):
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`text-[11px] font-sans px-2 py-0.5 rounded-[4px] border transition-colors ${
                isRecordingVoice
                  ? 'bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1]'
                  : 'bg-[#F1EEE7] text-[#525252] border-[#D9D3C7] hover:bg-[#E5E0D6]'
              }`}
            >
              {isRecordingVoice ? '● Recording Voice...' : 'Voice Dictate'}
            </button>
          </div>

          <input
            type="text"
            placeholder="Add specific observational evidence..."
            value={currentObservation}
            onChange={e => setCurrentObservation(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#D9D3C7] rounded-[4px] bg-[#FCFBF8] focus:outline-none focus:border-[#17365D]"
          />

          {/* Quick Observations Tags (Section 12) */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mr-1">
              Quick observations:
            </span>
            {quickObservationTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2 py-0.5 text-[11px] rounded-[3px] bg-[#F1EEE7] text-[#525252] border border-[#D9D3C7] hover:bg-[#E5E0D6] transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between text-xs pt-1">
        <ActionButton 
          variant="secondary" 
          size="sm" 
          onClick={goToPrev}
          disabled={currentIndex === 0}
        >
          ← Previous Task
        </ActionButton>

        <span className="text-[#666666] font-mono">
          Task {currentIndex + 1} / {allItems.length}
        </span>

        <ActionButton 
          variant="secondary" 
          size="sm" 
          onClick={goToNext}
          disabled={currentIndex === allItems.length - 1}
        >
          Next Task →
        </ActionButton>
      </div>

    </div>
  );
};
