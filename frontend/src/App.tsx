import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClassOverview } from './components/ClassOverview';
import { AssessmentInterface } from './components/AssessmentInterface';
import { StudentFingerprint } from './components/StudentFingerprint';
import { EvidenceExplorer } from './components/EvidenceExplorer';
import { ClassroomLearningMap } from './components/ClassroomLearningMap';
import { api } from './services/api';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [screenParams, setScreenParams] = useState<any>({ classId: 'CLS_G3A', studentId: 'ST001' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pre-seed local cache on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await api.getClasses();
        await api.getAssessments();
      } catch (e) {
        console.warn('Initial cache sync notice', e);
      }
    };
    initializeData();
  }, [refreshTrigger]);

  const handleNavigate = (screen: string, params?: any) => {
    if (params) {
      setScreenParams((prev: any) => ({ ...prev, ...params }));
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#252525] flex flex-col font-sans selection:bg-[#E5D8C1]">
      <Navbar 
        activeScreen={currentScreen} 
        onNavigate={handleNavigate}
        onRefreshData={handleRefresh}
      />

      <main className="flex-1 pb-16">
        {currentScreen === 'dashboard' && (
          <TeacherDashboard onNavigate={handleNavigate} />
        )}

        {currentScreen === 'class_overview' && (
          <ClassOverview 
            classId={screenParams.classId || 'CLS_G3A'} 
            onNavigate={handleNavigate} 
          />
        )}

        {currentScreen === 'assessment' && (
          <AssessmentInterface 
            studentId={screenParams.studentId || 'ST025'} 
            onNavigate={handleNavigate} 
          />
        )}

        {currentScreen === 'fingerprint' && (
          <StudentFingerprint 
            studentId={screenParams.studentId || 'ST001'} 
            onNavigate={handleNavigate} 
          />
        )}

        {currentScreen === 'evidence' && (
          <EvidenceExplorer 
            studentId={screenParams.studentId || 'ST001'} 
            initialSkillId={screenParams.skillId}
            onNavigate={handleNavigate} 
          />
        )}

        {currentScreen === 'learning_map' && (
          <ClassroomLearningMap 
            classId={screenParams.classId || 'CLS_G3A'} 
            onNavigate={handleNavigate} 
          />
        )}
      </main>

      {/* Institutional Editorial Colophon Footer */}
      <footer className="border-t border-[#D9D3C7] bg-[#FCFBF8] py-6 text-center text-xs font-sans text-[#666666]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-serif font-semibold text-[#17365D] text-sm">
              AI Learning Conductor — Foundational Learning Assessment System
            </p>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Phase 1.1: Institutional Clarity & Evidence-Grounded Learner Profiles
            </p>
          </div>
          <div className="text-right text-[11px] text-[#737373]">
            <p>Classroom Deployment Prototype • Zilla Parishad Primary School</p>
            <p className="text-[10px] text-[#8E8B82] mt-0.5">
              Modular FLN Taxonomy • Strict Evidence Grounding • Offline-First Storage
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
