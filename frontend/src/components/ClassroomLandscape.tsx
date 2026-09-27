import React from 'react';
import { ClassroomPlan } from '../services/api';

interface ClassroomLandscapeProps {
  plan: ClassroomPlan;
  onSelectPath?: (pathId: string) => void;
}

export const ClassroomLandscape: React.FC<ClassroomLandscapeProps> = ({
  plan,
  onSelectPath
}) => {
  const pathA = plan.paths.find(p => p.id === 'PATH_A');
  const pathB = plan.paths.find(p => p.id === 'PATH_B');
  const pathC = plan.paths.find(p => p.id === 'PATH_C');
  const pathD = plan.paths.find(p => p.id === 'PATH_D');

  return (
    <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-2">
        <div>
          <h3 className="font-serif font-bold text-base text-[#17365D]">
            Classroom Learning Landscape (Architectural Distribution)
          </h3>
          <p className="text-xs text-[#666666]">
            Visual allocation of 30 learners across differentiated attention tiers
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-[#F1EEE7] text-[#525252] border border-[#D9D3C7]">
          Total: {plan.total_students} Students
        </span>
      </div>

      {/* Landscape Diagram */}
      <div className="py-4 flex flex-col items-center">
        {/* Whole Class Node */}
        <div className="w-64 bg-[#17365D] text-[#FCFBF8] border border-[#0F243E] rounded-[4px] p-3 text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
            Baseline Evaluated Cohort
          </span>
          <span className="font-serif font-bold text-base">
            Whole Class ({plan.total_students} Students)
          </span>
          <span className="text-[10px] block opacity-90 mt-0.5">
            Topic: {plan.lesson_topic}
          </span>
        </div>

        {/* Stem down */}
        <div className="w-0.5 h-6 bg-[#B8B0A2]" />

        {/* Horizontal branch bar */}
        <div className="w-full max-w-2xl h-0.5 bg-[#B8B0A2] relative">
          {/* Connector ticks */}
          <div className="absolute left-[12%] -top-1 w-2 h-2 rounded-full bg-[#8A2F35]" />
          <div className="absolute left-[38%] -top-1 w-2 h-2 rounded-full bg-[#A87932]" />
          <div className="absolute left-[62%] -top-1 w-2 h-2 rounded-full bg-[#A87932]" />
          <div className="absolute left-[88%] -top-1 w-2 h-2 rounded-full bg-[#17365D]" />
        </div>

        {/* Drop lines and Path Nodes */}
        <div className="w-full max-w-2xl grid grid-cols-4 gap-3 pt-3">
          {/* Path A */}
          <div
            onClick={() => onSelectPath && onSelectPath('PATH_A')}
            className="cursor-pointer bg-[#FCFBF8] border-2 border-[#8A2F35] rounded-[4px] p-3 text-center space-y-1 hover:bg-[#FAF4EB] transition-all shadow-xs"
          >
            <span className="text-[10px] font-bold text-[#8A2F35] uppercase tracking-wider block">
              PATH A
            </span>
            <span className="font-serif font-bold text-lg text-[#17365D] block">
              {pathA?.students.length || 6}
            </span>
            <span className="text-[10px] text-[#252525] font-semibold block leading-tight">
              Regrouping Foundation
            </span>
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#8A2F35] text-[#FCFBF8] uppercase tracking-wide">
              Direct Teacher Focus
            </span>
          </div>

          {/* Path B */}
          <div
            onClick={() => onSelectPath && onSelectPath('PATH_B')}
            className="cursor-pointer bg-[#FCFBF8] border-2 border-[#A87932] rounded-[4px] p-3 text-center space-y-1 hover:bg-[#FAF4EB] transition-all shadow-xs"
          >
            <span className="text-[10px] font-bold text-[#A87932] uppercase tracking-wider block">
              PATH B
            </span>
            <span className="font-serif font-bold text-lg text-[#17365D] block">
              {pathB?.students.length || 4}
            </span>
            <span className="text-[10px] text-[#252525] font-semibold block leading-tight">
              Word Decoding
            </span>
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#A87932] text-[#FCFBF8] uppercase tracking-wide">
              Quick Teacher Check
            </span>
          </div>

          {/* Path C */}
          <div
            onClick={() => onSelectPath && onSelectPath('PATH_C')}
            className="cursor-pointer bg-[#FCFBF8] border-2 border-[#A87932] rounded-[4px] p-3 text-center space-y-1 hover:bg-[#FAF4EB] transition-all shadow-xs"
          >
            <span className="text-[10px] font-bold text-[#A87932] uppercase tracking-wider block">
              PATH C
            </span>
            <span className="font-serif font-bold text-lg text-[#17365D] block">
              {pathC?.students.length || 3}
            </span>
            <span className="text-[10px] text-[#252525] font-semibold block leading-tight">
              Number Comparison
            </span>
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#FAF4EB] text-[#8F6627] border border-[#E5D8C1] uppercase tracking-wide">
              Peer / Partner Game
            </span>
          </div>

          {/* Path D */}
          <div
            onClick={() => onSelectPath && onSelectPath('PATH_D')}
            className="cursor-pointer bg-[#FCFBF8] border-2 border-[#17365D] rounded-[4px] p-3 text-center space-y-1 hover:bg-[#F1EEE7] transition-all shadow-xs"
          >
            <span className="text-[10px] font-bold text-[#17365D] uppercase tracking-wider block">
              PATH D
            </span>
            <span className="font-serif font-bold text-lg text-[#17365D] block">
              {pathD?.students.length || 17}
            </span>
            <span className="text-[10px] text-[#252525] font-semibold block leading-tight">
              Consolidation
            </span>
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#17365D] text-[#FCFBF8] uppercase tracking-wide">
              Independent Practice
            </span>
          </div>
        </div>
      </div>

      {/* Rationale explanation strip */}
      <div className="bg-[#FAF4EB] border border-[#E5D8C1] p-3 rounded-[4px] text-xs text-[#525252] leading-relaxed">
        <b className="font-serif text-[#17365D]">Pedagogical Rationale:</b> Direct teacher attention is allocated to Path A because diagnostic assessment identified an unresolved prerequisite regrouping gap. Path D consolidates securely demonstrated skills independently in notebooks, preventing whole-class instructional drag while freeing the teacher's time.
      </div>
    </div>
  );
};
