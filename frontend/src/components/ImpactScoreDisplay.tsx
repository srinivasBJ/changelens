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
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Evidence-Weighted Impact Score
            </span>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-800 text-xs rounded text-slate-300 shadow-xl z-20">
                Transparent multi-factor heuristic scoring. Not a causal certainty claim.
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-extrabold font-mono text-indigo-400">
              {score.overall.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400">/ 1.00</span>
          </div>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Component Breakdown
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-300">{f.label}</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {f.value.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">({f.weight})</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(f.value * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs leading-relaxed text-indigo-200">
        <span className="font-semibold text-indigo-300 mr-1.5 uppercase tracking-wide">
          Synthesis:
        </span>
        {score.explanation}
      </div>
    </div>
  );
};
