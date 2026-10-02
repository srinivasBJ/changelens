import React from 'react';

interface Props {
  mode?: 'live' | 'demo' | string;
}

export const ModeBadge: React.FC<Props> = ({ mode = 'demo' }) => {
  const isDemo = mode.toLowerCase() === 'demo';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] uppercase ${
        isDemo
          ? 'bg-[#FFB800] text-[#000000]'
          : 'bg-[#00FF88] text-[#000000]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isDemo ? 'bg-[#000000]' : 'bg-[#000000]'
        }`}
      />
      <span>{isDemo ? 'DEMO' : 'LIVE'}</span>
    </div>
  );
};
