import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface NavbarProps {
  activeScreen: string;
  onNavigate: (screen: string, param?: any) => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeScreen, onNavigate, onRefreshData }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkSyncCount = async () => {
    try {
      const count = await api.getSyncQueueCount();
      setSyncQueueCount(count);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    checkSyncCount();
    const interval = setInterval(checkSyncCount, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleOffline = () => {
    const nextVal = !isOffline;
    setIsOffline(nextVal);
    api.setSimulatedOffline(nextVal);
  };

  const handleSyncNow = async () => {
    if (isOffline) {
      alert('Cannot sync while in Offline Mode. Switch to Online first.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await api.processSyncQueue();
      alert(`Sync completed: ${res.synced_count} records updated on institutional server.`);
      await checkSyncCount();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      alert('Sync failed. Please verify backend connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset classroom record to default 30-student assessment state?')) {
      await api.resetDemoData();
      if (onRefreshData) onRefreshData();
      onNavigate('dashboard');
    }
  };

  return (
    <header className="bg-[#FCFBF8] border-b border-[#D9D3C7] sticky top-0 z-50">
      
      {/* Topmost Institutional Meta Strip */}
      <div className="bg-[#17365D] text-[#FCFBF8] text-[11px] font-sans border-b border-[#0F243E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <span>FOUNDATIONAL LEARNING ASSESSMENT PLATFORM</span>
            <span className="text-[#8FA8C4] hidden sm:inline">•</span>
            <span className="text-[#D6E2EF] hidden sm:inline">Evidence-Based Classroom Support</span>
          </div>
          <div className="flex items-center gap-4 text-[#D6E2EF]">
            <span className="hidden md:inline">Zilla Parishad Primary School, Shirur</span>
            <button
              onClick={handleResetDemo}
              title="Reset classroom assessment records"
              className="text-[#D6E2EF] hover:text-[#FCFBF8] underline text-[10px]"
            >
              Reset Demo Records
            </button>
          </div>
        </div>
      </div>

      {/* Main Header & Navigation Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Institutional Identity Title */}
          <div 
            onClick={() => onNavigate('dashboard')} 
            className="cursor-pointer select-none flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xs bg-[#17365D] text-[#FCFBF8] flex items-center justify-center font-serif font-bold text-sm border border-[#0F243E]">
              LC
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-base sm:text-lg text-[#17365D] tracking-tight">
                  AI Learning Conductor
                </span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8A2F35] bg-[#F1EEE7] px-1.5 py-0.2 border border-[#D9D3C7] rounded-xs">
                  Phase 1.1
                </span>
              </div>
              <p className="text-[10px] font-sans text-[#666666] -mt-0.5 hidden sm:block">
                Foundational Learning Assessment & Classroom Map
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] ${
                activeScreen === 'dashboard'
                  ? 'bg-[#17365D] text-[#FCFBF8]'
                  : 'text-[#252525] hover:bg-[#F1EEE7]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('class_overview', { classId: 'CLS_G3A' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] ${
                activeScreen === 'class_overview'
                  ? 'bg-[#17365D] text-[#FCFBF8]'
                  : 'text-[#252525] hover:bg-[#F1EEE7]'
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => onNavigate('assessment', { studentId: 'ST025' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] ${
                activeScreen === 'assessment'
                  ? 'bg-[#17365D] text-[#FCFBF8]'
                  : 'text-[#252525] hover:bg-[#F1EEE7]'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => onNavigate('learning_map', { classId: 'CLS_G3A' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] ${
                activeScreen === 'learning_map'
                  ? 'bg-[#17365D] text-[#FCFBF8]'
                  : 'text-[#252525] hover:bg-[#F1EEE7]'
              }`}
            >
              Learning Map
            </button>
            <button
              onClick={() => onNavigate('diagnostic_overview', { classId: 'CLS_G3A' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] flex items-center gap-1.5 ${
                activeScreen === 'diagnostic_overview' || activeScreen === 'student_gap_analysis' || activeScreen === 'learning_gap_graph'
                  ? 'bg-[#8A2F35] text-[#FCFBF8]'
                  : 'text-[#8A2F35] bg-[#FAF4EB] border border-[#E5D8C1] hover:bg-[#F3E7D3]'
              }`}
            >
              <span className="font-semibold">Diagnostics</span>
              <span className="text-[10px] px-1 py-0.2 bg-black/10 rounded-xs">Phase 2</span>
            </button>
            <button
              onClick={() => onNavigate('orchestration', { classId: 'CLS_G3A' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] flex items-center gap-1.5 ${
                activeScreen === 'orchestration' || activeScreen === 'live_classroom'
                  ? 'bg-[#17365D] text-[#FCFBF8]'
                  : 'text-[#17365D] bg-[#EAE5D9] border border-[#D9D3C7] hover:bg-[#DDD5C5]'
              }`}
            >
              <span className="font-semibold">Orchestrate</span>
              <span className="text-[10px] px-1 py-0.2 bg-black/10 rounded-xs">Phase 3</span>
            </button>
            <button
              onClick={() => onNavigate('teach_and_adapt', { classId: 'CLS_G3A' })}
              className={`px-3 py-1.5 text-xs font-sans font-medium transition-colors rounded-[4px] flex items-center gap-1.5 ${
                activeScreen === 'teach_and_adapt' || activeScreen === 'live_teaching' || activeScreen === 'intervention_review'
                  ? 'bg-[#4F7658] text-[#FCFBF8]'
                  : 'text-[#4F7658] bg-[#EEF4EF] border border-[#CADBCE] hover:bg-[#DEEBE0]'
              }`}
            >
              <span className="font-semibold">Teach & Adapt</span>
              <span className="text-[10px] px-1 py-0.2 bg-black/10 rounded-xs">Phase 4</span>
            </button>
          </nav>

          {/* Teacher Status & Connectivity Indicator */}
          <div className="flex items-center gap-3 pl-3 border-l border-[#D9D3C7]">
            
            {/* Status Line */}
            <button
              onClick={toggleOffline}
              title={isOffline ? "Currently in Offline Mode (click to connect)" : "Connected to School Network (click to simulate offline)"}
              className="text-[11px] font-sans flex items-center gap-1.5 text-[#525252] hover:text-[#252525] transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-[#A87932]' : 'bg-[#4F7658]'}`} />
              <span className="hidden lg:inline">{isOffline ? 'Offline Mode' : 'Connected'}</span>
            </button>

            {/* Sync Queue */}
            {syncQueueCount > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={isOffline || isSyncing}
                className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-xs bg-[#FAF4EB] text-[#8F6627] border border-[#E5D8C1] hover:bg-[#F3E7D3]"
                title="Sync offline records to server"
              >
                {isSyncing ? 'Syncing...' : `${syncQueueCount} pending sync`}
              </button>
            )}

            {/* Teacher ID */}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-sans font-semibold text-[#17365D] leading-tight">Sunita Patil</p>
              <p className="text-[10px] font-sans text-[#737373]">Grade 3 Teacher</p>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
