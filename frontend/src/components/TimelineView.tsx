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
          badge: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
          dot: 'bg-blue-500',
        };
      case 'TELEMETRY':
        return {
          icon: Activity,
          badge: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
          dot: 'bg-rose-500',
        };
      case 'AGENT':
        return {
          icon: Cpu,
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
      case 'APPROVAL':
        return {
          icon: ShieldCheck,
          badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
          dot: 'bg-emerald-500',
        };
      case 'BUSINESS_IMPACT':
      case 'BUSINESS':
        return {
          icon: AlertTriangle,
          badge: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
          dot: 'bg-amber-500',
        };
      case 'HISTORICAL_MEMORY':
      case 'MEMORY':
        return {
          icon: History,
          badge: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
          dot: 'bg-amber-500',
        };
      default:
        return {
          icon: Clock,
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
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
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-[#222733] pb-2">
        <span>CHRONOLOGICAL MULTI-LANE EVIDENCE TIMELINE</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> LIVE EVIDENCE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> HISTORICAL MEMORY
          </span>
        </div>
      </div>

      <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#222733]">
        {events.map((evt, idx) => {
          const meta = getLaneMeta(evt.lane);
          const Icon = meta.icon;
          const isHistorical = evt.is_historical || evt.lane.toUpperCase().includes('MEMORY');

          return (
            <div
              key={idx}
              className={`relative rounded p-3 text-xs transition-colors ${
                isHistorical
                  ? 'border border-dashed border-amber-500/40 bg-[#14120e]'
                  : 'border border-[#222733] bg-[#13161c] hover:bg-[#181c24]'
              }`}
            >
              {/* Timeline marker */}
              <div
                className={`absolute -left-[23px] top-3.5 w-3 h-3 rounded-full border-2 border-[#0d0f12] flex items-center justify-center ${meta.dot}`}
              />

              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-300">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {evt.lane}
                  </span>
                  {isHistorical && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                      HISTORICAL CONTEXT
                    </span>
                  )}
                </div>
                <SourceBadge source={evt.source} />
              </div>

              <h4 className="text-xs font-bold text-slate-200 font-mono">
                {evt.title}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed font-sans">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
