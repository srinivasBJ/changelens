import React from 'react';

interface Props {
  source: string;
}

export const SourceBadge: React.FC<Props> = ({ source }) => {
  const getBadge = () => {
    switch (source.toLowerCase()) {
      case 'cloudtrail':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'cloudwatch':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'hindsight':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'agent':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'governance':
      case 'approval':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
      case 'dependency':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-medium border ${getBadge()}`}
    >
      {source}
    </span>
  );
};
