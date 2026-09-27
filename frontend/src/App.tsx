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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <b>AI Learning Conductor</b> — Phase 1: Assess & Build the Learning Map
          </p>
          <p className="text-[11px] text-slate-400">
            Evidence-First FLN Architecture • ASER & CBSE FLN Inspired • Zero Unsubstantiated AI Inference
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
