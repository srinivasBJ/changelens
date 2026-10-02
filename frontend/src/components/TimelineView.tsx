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
          badge: 'bg-[#A8A8A8]/15 text-[#A8A8A8] border-[#A8A8A8]/30',
          dot: 'bg-[#A8A8A8]',
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
          badge: 'bg-[#3a3a3a] text-[#A8A8A8] border-[#444444]',
          dot: 'bg-[#7A7A7A]',
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
      <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#7A7A7A] border-b border-[#3a3a3a] pb-3">
        <span className="uppercase tracking-[0.08em]">Chronological Multi-Lane Evidence Timeline</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
            <span className="text-[#A8A8A8] font-normal">Live Evidence</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
            <span className="text-[#A8A8A8] font-normal">Historical Memory</span>
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-[20px] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#333333]">
        {events.map((evt, idx) => {
          const meta = getLaneMeta(evt.lane);
          const Icon = meta.icon;
          const isHistorical = evt.is_historical || evt.lane.toUpperCase().includes('MEMORY');

          return (
            <div
              key={idx}
              className={`relative rounded-[10px] p-[20px] text-[13px] transition-colors ${
                isHistorical
                  ? 'border border-dashed border-[#FFB800]/50 bg-[#1f1f1f]'
                  : 'border border-[#3a3a3a] bg-[#1f1f1f] hover:bg-[#252525]'
              }`}
            >
              {/* 8px diameter time indicator dot */}
              <div
                className={`absolute -left-[27px] top-6 w-[8px] h-[8px] rounded-full ${meta.dot}`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[12px] font-bold text-[#D6D6D6] tabular">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] uppercase border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {evt.lane}
                  </span>
                  {isHistorical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] bg-[#FFB800] text-[#000000]">
                      HISTORICAL CONTEXT
                    </span>
                  )}
                </div>
                <SourceBadge source={evt.source} />
              </div>

              <h3 className="text-[15px] font-semibold text-[#D6D6D6] font-sans">
                {evt.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-[#A8A8A8] leading-[1.55] font-sans prose-limit">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
