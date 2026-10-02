import React from 'react';

interface Props {
  mode?: 'live' | 'demo' | string;
}

export const ModeBadge: React.FC<Props> = ({ mode = 'demo' }) => {
  const isDemo = mode.toLowerCase() === 'demo';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider border shadow-sm ${
        isDemo
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isDemo ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
        }`}
      />
      <span>{isDemo ? 'DEMO DATA' : 'LIVE AWS DATA'}</span>
    </div>
  );
};
