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
    <div className="p-[20px] rounded-[10px] border border-[#3a3a3a] bg-[#1f1f1f] space-y-[20px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#3a3a3a]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-sans font-semibold text-[#FFFFFF] leading-[1.45]">
              Evidence-Weighted Impact Score
            </h3>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-[#888888] cursor-pointer" />
              <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 w-64 p-2.5 bg-[#171717] border border-[#3a3a3a] text-[12px] font-sans rounded-[8px] text-[#C0C0C0] shadow-xl z-30">
                Transparent multi-factor heuristic scoring. Not a causal certainty claim.
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[32px] font-sans font-bold text-[#0066FF] leading-[1.2] tracking-[-0.02em] tabular">
              {score.overall.toFixed(2)}
            </span>
            <span className="text-[13px] font-sans text-[#888888]">/ 1.00</span>
          </div>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-sans font-semibold uppercase tracking-[0.08em] text-[#888888]">
          Score Component Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[20px]">
          {factors.map((f) => (
            <div key={f.label} className="p-3.5 rounded-[8px] bg-[#171717] border border-[#303030] space-y-2">
              <div className="flex justify-between items-center text-[13px] font-sans">
                <span className="text-[#C0C0C0] truncate">{f.label}</span>
                <span className="text-[#FFFFFF] font-mono text-[12px] font-medium tabular">
                  {f.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-[6px] bg-[#141414] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] rounded-[3px] transition-all"
                  style={{
                    width: `${Math.min(f.value * 100, 100)}%`,
                    boxShadow: '0 0 10px rgba(0, 102, 255, 0.5)',
                  }}
                />
              </div>
              <div className="text-[11px] font-sans text-[#888888] text-right font-medium">
                Weight: {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-[8px] bg-[#171717] border border-[#303030] text-[14px] font-sans font-normal text-[#C0C0C0] leading-[1.55] prose-limit">
        <span className="font-sans font-semibold text-[#0066FF] mr-2 text-[12px] uppercase tracking-[0.08em]">
          Synthesis:
        </span>
        {score.explanation}
      </div>
    </div>
  );
};
