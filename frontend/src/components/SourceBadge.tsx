import React from 'react';

interface Props {
  source: string;
}

export const SourceBadge: React.FC<Props> = ({ source }) => {
  const getBadge = () => {
    switch (source.toLowerCase()) {
      case 'cloudtrail':
        return 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border-[rgba(88,166,255,0.3)]';
      case 'cloudwatch':
        return 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]';
      case 'hindsight':
        return 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]';
      case 'agent':
        return 'bg-[#232327] text-[#A1A1AA] border-[#2A2A2F]';
      case 'governance':
      case 'approval':
        return 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]';
      case 'dependency':
        return 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF] border-[rgba(88,166,255,0.3)]';
      default:
        return 'bg-[#232327] text-[#A1A1AA] border-[#2A2A2F]';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans uppercase font-semibold tracking-[0.06em] border ${getBadge()}`}
    >
      {source}
    </span>
  );
};
