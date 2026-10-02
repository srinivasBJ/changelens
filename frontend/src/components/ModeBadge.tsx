import React from 'react';

interface Props {
  mode?: 'live' | 'demo' | string;
}

export const ModeBadge: React.FC<Props> = ({ mode = 'demo' }) => {
  const isDemo = mode.toLowerCase() === 'demo';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider border ${
        isDemo
          ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
          : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isDemo ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />
      <span>{isDemo ? 'DEMO DATA' : 'LIVE AWS DATA'}</span>
    </div>
  );
};
