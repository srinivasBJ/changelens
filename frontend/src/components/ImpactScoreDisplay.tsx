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
    <div className="p-5 rounded-[10px] border border-[#2A2A2F] bg-[#17171A] space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2F]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC] leading-[1.45]">
              Evidence-Weighted Impact Score
            </h3>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-[#71717A] cursor-pointer" />
              <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-64 p-2.5 bg-[#1E1E22] border border-[#2A2A2F] text-[12px] font-sans rounded-[6px] text-[#A1A1AA] shadow-xl z-30">
                Transparent multi-factor heuristic scoring. Not a causal certainty claim.
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[28px] font-sans font-bold text-[#58A6FF] leading-[1.2] tracking-[-0.02em] tabular">
              {score.overall.toFixed(2)}
            </span>
            <span className="text-[13px] font-sans text-[#71717A]">/ 1.00</span>
          </div>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
          Score Component Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {factors.map((f) => (
            <div key={f.label} className="p-3.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] space-y-2">
              <div className="flex justify-between items-center text-[13px] font-sans">
                <span className="text-[#A1A1AA] truncate">{f.label}</span>
                <span className="text-[#ECECEC] font-mono text-[12px] font-medium tabular">
                  {f.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-[6px] bg-[#121214] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-[#2F6FAD] rounded-[3px] transition-all"
                  style={{
                    width: `${Math.min(f.value * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] font-sans text-[#71717A] text-right font-medium">
                Weight: {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[13px] font-sans font-normal text-[#A1A1AA] leading-[1.55] prose-limit">
        <span className="font-sans font-semibold text-[#58A6FF] mr-2 text-[11px] uppercase tracking-[0.06em]">
          Synthesis:
        </span>
        {score.explanation}
      </div>
    </div>
  );
};
