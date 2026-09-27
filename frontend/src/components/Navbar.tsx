import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Users, 
  ClipboardCheck, 
  Map, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  RotateCcw,
  Sparkles,
  School
} from 'lucide-react';
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
      alert(`Sync completed! ${res.synced_count} items uploaded to server.`);
      await checkSyncCount();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      alert('Sync failed. Please check backend connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data back to default 30 students and pre-seeded profiles?')) {
      await api.resetDemoData();
      alert('Demo data successfully reset!');
      if (onRefreshData) onRefreshData();
      onNavigate('dashboard');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AI Learning Conductor</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Phase 1: Assess & Map
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Evidence-Based Foundational Learning Map
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeScreen === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('class_overview', { classId: 'CLS_G3A' })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeScreen === 'class_overview'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Grade 3-A Class
            </button>
            <button
              onClick={() => onNavigate('learning_map', { classId: 'CLS_G3A' })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeScreen === 'learning_map'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Map className="w-4 h-4 text-indigo-600" />
              Classroom Learning Map
            </button>
          </nav>

          {/* Teacher Status & Controls */}
          <div className="flex items-center space-x-3">
            {/* Offline Simulator Switch */}
            <button
              onClick={toggleOffline}
              title={isOffline ? "Currently in Offline Mode (click to go online)" : "Currently Online (click to simulate offline)"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isOffline 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isOffline ? 'Offline Mode' : 'Online'}</span>
            </button>

            {/* Sync Queue Badge */}
            {syncQueueCount > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={isOffline || isSyncing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                title="Click to sync local evidence to server"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncQueueCount} to sync</span>
              </button>
            )}

            {/* Reset Demo Button */}
            <button
              onClick={handleResetDemo}
              title="Reset Demo to fresh 30-student data"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Teacher Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs border border-blue-200">
                SP
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">Sunita Patil</p>
                <p className="text-[10px] text-slate-500">Teacher • Gr 3</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
