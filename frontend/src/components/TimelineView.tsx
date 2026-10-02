import React from 'react';
import { TimelineEvent } from '@/lib/types';
import { SourceBadge } from './SourceBadge';
import { Clock, History, AlertTriangle, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

interface Props {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<Props> = ({ events }) => {
  const getLaneMeta = (lane: string) => {
    switch (lane.toUpperCase()) {
      case 'CHANGE':
        return {
          icon: Zap,
          badge: 'bg-[#0066FF]/15 text-[#0066FF] border-[#0066FF]/30',
          dot: 'bg-[#0066FF]',
        };
      case 'TELEMETRY':
        return {
          icon: Activity,
          badge: 'bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30',
          dot: 'bg-[#FF3366]',
        };
      case 'AGENT':
        return {
          icon: Cpu,
          badge: 'bg-[#A0A0A0]/15 text-[#A0A0A0] border-[#A0A0A0]/30',
          dot: 'bg-[#A0A0A0]',
        };
      case 'APPROVAL':
        return {
          icon: ShieldCheck,
          badge: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30',
          dot: 'bg-[#00FF88]',
        };
      case 'BUSINESS_IMPACT':
      case 'BUSINESS':
        return {
          icon: AlertTriangle,
          badge: 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30',
          dot: 'bg-[#FFB800]',
        };
      case 'HISTORICAL_MEMORY':
      case 'MEMORY':
        return {
          icon: History,
          badge: 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30',
          dot: 'bg-[#FFB800]',
        };
      default:
        return {
          icon: Clock,
          badge: 'bg-[#2a2a2a] text-[#A0A0A0] border-[#333333]',
          dot: 'bg-[#666666]',
        };
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-[20px]">
      <div className="flex items-center justify-between text-xs font-mono text-[#666666] border-b border-[#2a2a2a] pb-3">
        <span className="uppercase tracking-[1px] font-semibold">CHRONOLOGICAL MULTI-LANE EVIDENCE TIMELINE</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
            <span className="text-[#A0A0A0]">LIVE EVIDENCE</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
            <span className="text-[#A0A0A0]">HISTORICAL MEMORY</span>
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-[20px] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#1a1a1a]">
        {events.map((evt, idx) => {
          const meta = getLaneMeta(evt.lane);
          const Icon = meta.icon;
          const isHistorical = evt.is_historical || evt.lane.toUpperCase().includes('MEMORY');

          return (
            <div
              key={idx}
              className={`relative rounded-[10px] p-[20px] text-xs transition-colors ${
                isHistorical
                  ? 'border border-dashed border-[#FFB800]/50 bg-[#0a0a0a]'
                  : 'border border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#111111]'
              }`}
            >
              {/* 8px diameter time indicator dot */}
              <div
                className={`absolute -left-[27px] top-6 w-[8px] h-[8px] rounded-full ${meta.dot}`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {evt.lane}
                  </span>
                  {isHistorical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFB800] text-[#000000]">
                      HISTORICAL CONTEXT
                    </span>
                  )}
                </div>
                <SourceBadge source={evt.source} />
              </div>

              <h4 className="text-sm font-bold text-[#FFFFFF] font-mono">
                {evt.title}
              </h4>
              <p className="mt-1.5 text-xs text-[#A0A0A0] leading-relaxed font-sans">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
