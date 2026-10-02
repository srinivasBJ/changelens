import React from 'react';
import { ConfidenceLevel } from '@/lib/types';

interface Props {
  confidence?: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence = 'insufficient' }) => {
  const getStyles = () => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]';
      case 'medium':
        return 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]';
      case 'low':
        return 'bg-[rgba(248,81,73,0.15)] text-[#F85149] border-[rgba(248,81,73,0.3)]';
      default:
        return 'bg-[rgba(248,81,73,0.15)] text-[#F85149] border-[rgba(248,81,73,0.3)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] border uppercase ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      CONFIDENCE: {confidence}
    </span>
  );
};
