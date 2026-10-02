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
    <div className="p-[20px] rounded-[10px] border border-[#2a2a2a] bg-[#0a0a0a] space-y-[20px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#2a2a2a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono uppercase font-semibold tracking-wider text-[#666666]">
              Evidence-Weighted Impact Score
            </span>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-[#666666] cursor-pointer" />
              <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-64 p-2.5 bg-[#111111] border border-[#2a2a2a] text-[11px] font-mono rounded-[8px] text-[#A0A0A0] shadow-xl z-30">
                Transparent multi-factor heuristic scoring. Not a causal certainty claim.
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[32px] font-bold font-mono text-[#0066FF] leading-none">
              {score.overall.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-[#666666]">/ 1.00</span>
          </div>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>

      <div className="space-y-3">
        <span className="text-[11px] font-mono uppercase font-semibold text-[#666666] tracking-[1px]">
          Score Component Breakdown
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[20px]">
          {factors.map((f) => (
            <div key={f.label} className="p-3.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#666666] truncate">{f.label}</span>
                <span className="text-[#FFFFFF] font-bold">
                  {f.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-[6px] bg-[#1a1a1a] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] rounded-[3px] transition-all"
                  style={{
                    width: `${Math.min(f.value * 100, 100)}%`,
                    boxShadow: '0 0 10px rgba(0, 102, 255, 0.5)',
                  }}
                />
              </div>
              <div className="text-[10px] font-mono text-[#666666] text-right">
                Weight: {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] text-xs text-[#A0A0A0] leading-relaxed font-sans">
        <span className="font-mono font-bold text-[#0066FF] mr-2 text-[11px] uppercase tracking-wider">
          SYNTHESIS:
        </span>
        {score.explanation}
      </div>
    </div>
  );
};
