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
          color: 'text-blue-400',
          dot: 'bg-blue-500',
          badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
        };
      case 'TELEMETRY':
        return {
          icon: Activity,
          color: 'text-rose-400',
          dot: 'bg-rose-500',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        };
      case 'AGENT':
        return {
          icon: Cpu,
          color: 'text-cyan-400',
          dot: 'bg-cyan-500',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        };
      case 'APPROVAL':
        return {
          icon: ShieldCheck,
          color: 'text-yellow-400',
          dot: 'bg-yellow-500',
          badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40',
        };
      case 'BUSINESS_IMPACT':
      case 'BUSINESS':
        return {
          icon: AlertTriangle,
          color: 'text-pink-400',
          dot: 'bg-pink-500',
          badge: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
        };
      case 'HISTORICAL_MEMORY':
      case 'MEMORY':
        return {
          icon: History,
          color: 'text-amber-400',
          dot: 'bg-amber-500',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-400',
          dot: 'bg-slate-500',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toISOString().substring(11, 19);
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
        <span>Investigation Timeline (Chronological Multi-Lane)</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Current Evidence
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Historical Context
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((evt, idx) => {
          const meta = getLaneMeta(evt.lane);
          const Icon = meta.icon;
          const isHistorical = evt.is_historical || evt.lane.toUpperCase().includes('MEMORY');

          return (
            <div
              key={idx}
              className={`relative rounded-xl p-4 transition-all duration-150 ${
                isHistorical
                  ? 'border-2 border-dashed border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/20'
                  : 'border border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              {/* Timeline marker */}
              <div
                className={`absolute -left-[30px] top-4.5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${meta.dot}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {evt.lane}
                  </span>
                  {isHistorical && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HISTORICAL CONTEXT
                    </span>
                  )}
                </div>
                <SourceBadge source={evt.source} />
              </div>

              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                {evt.title}
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
