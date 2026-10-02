import React from 'react';

interface Props {
  source: string;
}

export const SourceBadge: React.FC<Props> = ({ source }) => {
  const getBadge = () => {
    switch (source.toLowerCase()) {
      case 'cloudtrail':
        return 'bg-blue-950/40 text-blue-400 border-blue-800/60';
      case 'cloudwatch':
        return 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60';
      case 'hindsight':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
      case 'agent':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'governance':
      case 'approval':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
      case 'dependency':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-800/60 text-slate-400 border-slate-700/60';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getBadge()}`}
    >
      {source}
    </span>
  );
};
