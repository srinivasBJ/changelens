import React from 'react';
import { ImpactScore } from '@/lib/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Info } from 'lucide-react';

interface Props {
  score?: ImpactScore;
}

export const ImpactScoreDisplay: React.FC<Props> = ({ score }) => {
  if (!score) return null;

  const factors = [
    { label: 'Metric Severity', value: score.metric_severity, weight: '35%' },
    { label: 'Temporal Proximity', value: score.temporal_proximity, weight: '25%' },
    { label: 'Dependency Weight', value: score.dependency_weight, weight: '20%' },
    { label: 'Actor Context', value: score.actor_context, weight: '10%' },
    { label: 'Historical Similarity', value: score.historical_similarity, weight: '10%' },
  ];

  return (
    <div className="p-4 rounded border border-[#222733] bg-[#13161c] space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222733]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">
              Evidence-Weighted Impact Score
            </span>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
              <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-64 p-2 bg-[#1c202a] border border-[#2e3544] text-[11px] font-mono rounded text-slate-300 shadow-xl z-30">
                Transparent multi-factor heuristic scoring. Not a causal certainty claim.
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono text-blue-400">
              {score.overall.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 1.00</span>
          </div>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 tracking-wider">
          Score Component Breakdown
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {factors.map((f) => (
            <div key={f.label} className="p-2.5 rounded bg-[#0d0f12] border border-[#1f242e] space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400 truncate">{f.label}</span>
                <span className="text-slate-200 font-bold">
                  {f.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1 bg-[#1e2430] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-sm"
                  style={{ width: `${Math.min(f.value * 100, 100)}%` }}
                />
              </div>
              <div className="text-[9px] font-mono text-slate-500 text-right">
                Weight: {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2.5 rounded bg-[#0d0f12] border border-[#1f242e] text-xs text-slate-300 leading-relaxed font-sans">
        <span className="font-mono font-bold text-blue-400 mr-2 text-[10px] uppercase tracking-wider">
          SYNTHESIS:
        </span>
        {score.explanation}
      </div>
    </div>
  );
};
