import React, { useState, useEffect } from 'react';
import { api, IS_DEMO_MODE } from '../services/api';

interface NavbarProps {
  activeScreen: string;
  onNavigate: (screen: string, param?: any) => void;
  onRefreshData?: () => void;
}

// Maps nav module names to the activeScreen keys they correspond to
const NAV_ITEMS: {
  label: string;
  screen: string;
  activeScreens: string[];
  param?: any;
}[] = [
  {
    label: 'Overview',
    screen: 'dashboard',
    activeScreens: ['dashboard'],
  },
  {
    label: 'Students',
    screen: 'class_overview',
    activeScreens: ['class_overview', 'fingerprint', 'evidence'],
    param: { classId: 'CLS_G3A' },
  },
  {
    label: 'Assessments',
    screen: 'assessment',
    activeScreens: ['assessment'],
    param: { studentId: 'ST025' },
  },
  {
    label: 'Learning Map',
    screen: 'learning_map',
    activeScreens: ['learning_map'],
    param: { classId: 'CLS_G3A' },
  },
  {
    label: 'Insights',
    screen: 'diagnostic_overview',
    activeScreens: ['diagnostic_overview', 'diagnostics', 'student_gap_analysis', 'learning_gap_graph'],
    param: { classId: 'CLS_G3A' },
  },
  {
    label: 'Teaching',
    screen: 'teach_and_adapt',
    activeScreens: [
      'teach_and_adapt', 'teach_adapt',
      'orchestration', 'live_classroom',
      'live_teaching', 'intervention_review',
    ],
    param: { classId: 'CLS_G3A' },
  },
  {
    label: 'School Intelligence',
    screen: 'school_intelligence',
    activeScreens: ['school_intelligence'],
  },
];

export const Navbar: React.FC<NavbarProps> = ({ activeScreen, onNavigate, onRefreshData }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);

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

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.activeScreens.includes(activeScreen);

  // Primary nav items (always visible)
  const primaryNav = NAV_ITEMS.slice(0, 6); // Overview → Teaching
  // Secondary nav items (in "More" dropdown at narrow widths)
  const secondaryNav = NAV_ITEMS.slice(6); // School Intelligence

  return (
    <header className="bg-[#FCFBF8] border-b border-[#D9D3C7] sticky top-0 z-50">

      {/* Demonstration Environment Banner */}
      {IS_DEMO_MODE && (
        <div className="bg-[#17365D] border-b border-[#0F243E] text-[#B8CEDE] text-[10px] font-sans text-center py-0.5 tracking-widest uppercase">
          Demonstration Environment — Sample classroom data. Not real student records.
        </div>
      )}

      {/* Institutional Meta Strip */}
      <div className="bg-[#1E3F6B] text-[#FCFBF8] text-[10.5px] font-sans border-b border-[#0F243E]">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6 h-7 flex items-center justify-between">
          <span className="tracking-wide font-medium uppercase text-[9.5px] text-[#A8BDD0]">
            Foundational Learning Intelligence Platform
          </span>
          <div className="flex items-center gap-4 text-[#B8CEDE]">
            <span className="hidden md:inline text-[9.5px]">Zilla Parishad Primary School, Shirur</span>
            {IS_DEMO_MODE && (
              <button
                onClick={handleResetDemo}
                title="Reset classroom assessment records to demo defaults"
                className="text-[#B8CEDE] hover:text-[#FCFBF8] text-[9.5px] underline underline-offset-2 transition-colors"
              >
                Reset Demo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 gap-4">

          {/* Brand Identity */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 shrink-0 min-w-0 cursor-pointer group"
            aria-label="AI Learning Conductor — Go to Overview"
          >
            <div className="w-7 h-7 shrink-0 bg-[#17365D] text-[#FCFBF8] flex items-center justify-center font-serif font-bold text-[11px] border border-[#0F243E] rounded-[3px]">
              LC
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="font-serif font-bold text-[#17365D] text-[14px] leading-tight tracking-tight whitespace-nowrap group-hover:text-[#0F243E] transition-colors">
                AI Learning Conductor
              </div>
              <div className="text-[9.5px] font-sans text-[#737373] leading-none mt-0.5 whitespace-nowrap">
                Evidence-Based Classroom Support
              </div>
            </div>
          </button>

          {/* Primary Navigation */}
          <nav
            className="flex items-center gap-0.5 overflow-hidden"
            role="navigation"
            aria-label="Main navigation"
          >
            {primaryNav.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.screen}
                  onClick={() => onNavigate(item.screen, item.param)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    px-2.5 py-1.5 text-[11.5px] font-sans font-medium transition-colors whitespace-nowrap rounded-[3px]
                    ${active
                      ? 'bg-[#17365D] text-[#FCFBF8]'
                      : 'text-[#374151] hover:bg-[#F1EEE7] hover:text-[#17365D]'
                    }
                  `}
                >
                  {item.label}
                </button>
              );
            })}

            {/* School Intelligence — always visible but last */}
            {secondaryNav.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.screen}
                  onClick={() => onNavigate(item.screen, item.param)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    px-2.5 py-1.5 text-[11.5px] font-sans font-medium transition-colors whitespace-nowrap rounded-[3px]
                    hidden lg:block
                    ${active
                      ? 'bg-[#17365D] text-[#FCFBF8]'
                      : 'text-[#374151] hover:bg-[#F1EEE7] hover:text-[#17365D]'
                    }
                  `}
                >
                  {item.label}
                </button>
              );
            })}

            {/* More ▾ dropdown for narrower screens */}
            <div className="relative lg:hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setMoreOpen(v => !v); }}
                className="px-2.5 py-1.5 text-[11.5px] font-sans font-medium text-[#374151] hover:bg-[#F1EEE7] hover:text-[#17365D] rounded-[3px] transition-colors flex items-center gap-1"
                aria-haspopup="true"
                aria-expanded={moreOpen}
              >
                More
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-1 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] shadow-md z-50 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {secondaryNav.map((item) => {
                    const active = isActive(item);
                    return (
                      <button
                        key={item.screen}
                        onClick={() => { onNavigate(item.screen, item.param); setMoreOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11.5px] font-sans font-medium transition-colors ${
                          active
                            ? 'bg-[#17365D] text-[#FCFBF8]'
                            : 'text-[#374151] hover:bg-[#F1EEE7]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Status + Sync + Teacher */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Connectivity indicator */}
            <button
              onClick={toggleOffline}
              title={isOffline
                ? 'Offline Mode active — click to reconnect'
                : 'Connected to school server — click to simulate offline'}
              className="flex items-center gap-1.5 text-[11px] font-sans text-[#525252] hover:text-[#252525] transition-colors"
              aria-label={isOffline ? 'Offline Mode' : 'Connected'}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOffline ? 'bg-[#A87932]' : 'bg-[#4F7658]'}`} />
              <span className="hidden md:inline text-[10.5px]">
                {isOffline ? 'Offline' : 'Connected'}
              </span>
            </button>

            {/* Pending sync badge */}
            {syncQueueCount > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={isOffline || isSyncing}
                title="Synchronise offline records to school server"
                className="text-[10.5px] font-sans font-medium px-2 py-0.5 rounded-[3px] bg-[#FAF4EB] text-[#8F6627] border border-[#E5D8C1] hover:bg-[#F3E7D3] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isSyncing ? 'Syncing…' : `${syncQueueCount} pending`}
              </button>
            )}

            {/* Teacher identity */}
            <div className="hidden md:block text-right border-l border-[#D9D3C7] pl-3">
              <p className="text-[11px] font-sans font-semibold text-[#17365D] leading-tight">Sunita Patil</p>
              <p className="text-[9.5px] font-sans text-[#737373] leading-tight">Grade 3 Teacher</p>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
