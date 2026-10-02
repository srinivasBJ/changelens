import React from 'react';
import { ConfidenceLevel } from '@/lib/types';

interface Props {
  confidence?: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<Props> = ({ confidence = 'insufficient' }) => {
  const getStyles = () => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30';
      case 'medium':
        return 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30';
      case 'low':
        return 'bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30';
      default:
        return 'bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30';
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
