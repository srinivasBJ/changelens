import React from 'react';

interface Props {
  source: string;
}

export const SourceBadge: React.FC<Props> = ({ source }) => {
  const getBadge = () => {
    switch (source.toLowerCase()) {
      case 'cloudtrail':
        return 'bg-[#0066FF]/15 text-[#0066FF] border-[#0066FF]/30';
      case 'cloudwatch':
        return 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30';
      case 'hindsight':
        return 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30';
      case 'agent':
        return 'bg-[#A0A0A0]/15 text-[#A0A0A0] border-[#A0A0A0]/30';
      case 'governance':
      case 'approval':
        return 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30';
      case 'dependency':
        return 'bg-[#0066FF]/15 text-[#0066FF] border-[#0066FF]/30';
      default:
        return 'bg-[#2a2a2a] text-[#A0A0A0] border-[#333333]';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold border ${getBadge()}`}
    >
      {source}
    </span>
  );
};
