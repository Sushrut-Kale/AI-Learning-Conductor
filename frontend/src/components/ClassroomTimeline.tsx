import React from 'react';
import { LessonSegment } from '../services/api';

interface ClassroomTimelineProps {
  timeline: LessonSegment[];
  totalMinutes: number;
  currentMinute?: number;
  onSelectSegment?: (segment: LessonSegment) => void;
  selectedSegmentId?: string;
}

export const ClassroomTimeline: React.FC<ClassroomTimelineProps> = ({
  timeline,
  totalMinutes,
  currentMinute,
  onSelectSegment,
  selectedSegmentId
}) => {
  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'teacher_focus':
        return {
          bg: 'bg-[#8A2F35]',
          text: 'text-[#FCFBF8]',
          badge: 'bg-[#5E1E22] text-[#FCFBF8]',
          border: 'border-[#5E1E22]'
        };
      case 'quick_check':
      case 'peer_supported':
        return {
          bg: 'bg-[#A87932]',
          text: 'text-[#FCFBF8]',
          badge: 'bg-[#73511F] text-[#FCFBF8]',
          border: 'border-[#73511F]'
        };
      case 'whole_class':
        return {
          bg: 'bg-[#17365D]',
          text: 'text-[#FCFBF8]',
          badge: 'bg-[#0E233C] text-[#FCFBF8]',
          border: 'border-[#0E233C]'
        };
      case 'exit_evidence':
        return {
          bg: 'bg-[#4F7658]',
          text: 'text-[#FCFBF8]',
          badge: 'bg-[#35503B] text-[#FCFBF8]',
          border: 'border-[#35503B]'
        };
      default:
        return {
          bg: 'bg-[#EAE5D9]',
          text: 'text-[#252525]',
          badge: 'bg-[#D9D3C7] text-[#252525]',
          border: 'border-[#D9D3C7]'
        };
    }
  };

  return (
    <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#D9D3C7] pb-3">
        <div>
          <h3 className="font-serif font-bold text-base text-[#17365D]">
            Classroom Instructional Timeline
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Orchestrated sequence balancing direct teacher attention against independent & peer workflows ({totalMinutes} minutes total)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#525252]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#8A2F35]" /> Direct Teacher Attention
          </span>
          <span className="flex items-center gap-1.5 text-[#525252]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#A87932]" /> Quick Check / Peer
          </span>
          <span className="flex items-center gap-1.5 text-[#525252]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#17365D]" /> Whole Class
          </span>
          <span className="flex items-center gap-1.5 text-[#525252]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4F7658]" /> Exit Evidence
          </span>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="relative pt-1 pb-2">
        <div className="w-full flex h-12 rounded-[4px] overflow-hidden border border-[#B8B0A2] shadow-xs">
          {timeline.map((seg) => {
            const segDuration = seg.end_minute - seg.start_minute;
            const widthPct = Math.max(12, (segDuration / totalMinutes) * 100);
            const style = getSegmentColor(seg.segment_type);
            const isSelected = selectedSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                onClick={() => onSelectSegment && onSelectSegment(seg)}
                style={{ width: `${widthPct}%` }}
                className={`${style.bg} ${style.text} p-2 flex flex-col justify-between cursor-pointer border-r border-[#FCFBF8]/30 transition-all hover:brightness-110 relative ${
                  isSelected ? 'ring-2 ring-offset-1 ring-[#17365D] z-10' : ''
                }`}
                title={`${seg.title} (${seg.start_minute}-${seg.end_minute} min): ${seg.teacher_role}`}
              >
                <div className="flex items-center justify-between text-[10px] leading-tight font-medium">
                  <span className="truncate pr-1">{seg.title}</span>
                  <span className="font-mono text-[9px] opacity-80 whitespace-nowrap">
                    {seg.start_minute}–{seg.end_minute}m
                  </span>
                </div>
                <div className="text-[9px] opacity-90 truncate font-sans">
                  {seg.active_path_id ? seg.active_path_id : `${seg.students_involved_count} students`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time ruler ticks */}
        <div className="flex justify-between text-[10px] font-mono text-[#737373] mt-1.5 px-0.5">
          <span>00:00</span>
          <span>05:00</span>
          <span>15:00</span>
          <span>25:00</span>
          <span>35:00</span>
          <span>{totalMinutes}:00 min</span>
        </div>
      </div>

      {/* Detailed Segment Flow Table */}
      <div className="border border-[#D9D3C7] rounded-[4px] overflow-hidden">
        <table className="institutional-table text-xs">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left w-20">Time</th>
              <th className="py-2 px-3 text-left w-48">Segment & Focus</th>
              <th className="py-2 px-3 text-left">Teacher Role (Direct Attention)</th>
              <th className="py-2 px-3 text-left">Class Activity (While Teacher Engaged)</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((seg, idx) => {
              const style = getSegmentColor(seg.segment_type);
              return (
                <tr key={seg.id} className="hover:bg-[#F1EEE7] transition-colors border-b border-[#EFECE5]">
                  <td className="py-2 px-3 font-mono font-medium text-[#17365D]">
                    {String(seg.start_minute).padStart(2, '0')}:00–{String(seg.end_minute).padStart(2, '0')}:00
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-xs ${style.bg}`} />
                      <span className="font-semibold text-[#252525]">{seg.title}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[#252525] font-serif text-[12px] leading-relaxed">
                    {seg.teacher_role}
                  </td>
                  <td className="py-2 px-3 text-[#525252] text-[11px] leading-relaxed">
                    {seg.class_activity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
