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
          badge: 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border-[rgba(88,166,255,0.3)]',
          dot: 'bg-[#58A6FF]',
        };
      case 'TELEMETRY':
        return {
          icon: Activity,
          badge: 'bg-[rgba(248,81,73,0.15)] text-[#F85149] border-[rgba(248,81,73,0.3)]',
          dot: 'bg-[#F85149]',
        };
      case 'AGENT':
        return {
          icon: Cpu,
          badge: 'bg-[#232327] text-[#A1A1AA] border-[#2A2A2F]',
          dot: 'bg-[#71717A]',
        };
      case 'APPROVAL':
        return {
          icon: ShieldCheck,
          badge: 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]',
          dot: 'bg-[#3FB950]',
        };
      case 'BUSINESS_IMPACT':
      case 'BUSINESS':
        return {
          icon: AlertTriangle,
          badge: 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]',
          dot: 'bg-[#D29922]',
        };
      case 'HISTORICAL_MEMORY':
      case 'MEMORY':
        return {
          icon: History,
          badge: 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]',
          dot: 'bg-[#D29922]',
        };
      default:
        return {
          icon: Clock,
          badge: 'bg-[#232327] text-[#A1A1AA] border-[#2A2A2F]',
          dot: 'bg-[#71717A]',
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
    <div className="space-y-5">
      <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#71717A] border-b border-[#2A2A2F] pb-3">
        <span className="uppercase tracking-[0.06em]">Chronological Multi-Lane Evidence Timeline</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#58A6FF]" />
            <span className="text-[#A1A1AA] font-normal">Live Evidence</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D29922]" />
            <span className="text-[#A1A1AA] font-normal">Historical Memory</span>
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#2A2A2F]">
        {events.map((evt, idx) => {
          const meta = getLaneMeta(evt.lane);
          const Icon = meta.icon;
          const isHistorical = evt.is_historical || evt.lane.toUpperCase().includes('MEMORY');

          return (
            <div
              key={idx}
              className={`relative rounded-[10px] p-5 text-[13px] transition-colors ${
                isHistorical
                  ? 'border border-dashed border-[rgba(210,153,34,0.4)] bg-[#17171A]'
                  : 'border border-[#2A2A2F] bg-[#17171A] hover:bg-[#232327]'
              }`}
            >
              {/* 8px diameter time indicator dot */}
              <div
                className={`absolute -left-[27px] top-6 w-[8px] h-[8px] rounded-full ${meta.dot}`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[12px] font-bold text-[#ECECEC] tabular">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] uppercase border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {evt.lane}
                  </span>
                  {isHistorical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] bg-[rgba(210,153,34,0.15)] text-[#D29922] border border-[rgba(210,153,34,0.3)]">
                      HISTORICAL CONTEXT
                    </span>
                  )}
                </div>
                <SourceBadge source={evt.source} />
              </div>

              <h3 className="text-[15px] font-semibold text-[#ECECEC] font-sans">
                {evt.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-[#A1A1AA] leading-[1.55] font-sans prose-limit">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
