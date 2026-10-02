import React from 'react';
import { ConfidenceLevel } from '@/lib/types';

interface Props {
  confidence?: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence = 'insufficient' }) => {
  const getStyles = () => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60';
      case 'medium':
        return 'bg-amber-950/50 text-amber-400 border-amber-800/60';
      case 'low':
        return 'bg-orange-950/50 text-orange-400 border-orange-800/60';
      default:
        return 'bg-rose-950/50 text-rose-400 border-rose-800/60';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border uppercase ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      CONFIDENCE: {confidence}
    </span>
  );
};
