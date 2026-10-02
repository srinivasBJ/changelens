import React from 'react';

interface Props {
  mode?: 'live' | 'demo' | string;
}

export const ModeBadge: React.FC<Props> = ({ mode = 'demo' }) => {
  const isDemo = mode.toLowerCase() === 'demo';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-[0.06em] uppercase border ${
        isDemo
          ? 'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]'
          : 'bg-[rgba(63,185,80,0.15)] text-[#3FB950] border-[rgba(63,185,80,0.3)]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isDemo ? 'bg-[#D29922]' : 'bg-[#3FB950]'
        }`}
      />
      <span>{isDemo ? 'DEMO' : 'LIVE'}</span>
    </div>
  );
};
