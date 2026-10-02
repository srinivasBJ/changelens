import React from 'react';
import { ConfidenceLevel } from '@/lib/types';

interface Props {
  confidence?: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence = 'insufficient' }) => {
  const getStyles = () => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20';
      case 'low':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/40 ring-1 ring-orange-500/20';
      default:
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border uppercase ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      Confidence: {confidence}
    </span>
  );
};
