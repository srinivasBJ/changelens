import React from 'react';

interface Props {
  mode?: 'live' | 'demo' | string;
}

export const ModeBadge: React.FC<Props> = ({ mode = 'demo' }) => {
  const isDemo = mode.toLowerCase() === 'demo';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold tracking-wider ${
        isDemo
          ? 'bg-[#FFB800] text-[#000000]'
          : 'bg-[#00FF88] text-[#000000]'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isDemo ? 'bg-[#000000]' : 'bg-[#000000]'
        }`}
      />
      <span>{isDemo ? 'DEMO' : 'LIVE'}</span>
    </div>
  );
};
