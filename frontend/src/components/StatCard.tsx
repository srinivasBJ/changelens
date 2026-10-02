import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  highlight?: boolean;
}

export const StatCard: React.FC<Props> = ({
  label,
  value,
  icon: Icon,
  subtext,
  highlight = false,
}) => {
  return (
    <div
      className={`p-[20px] rounded-[10px] border transition-colors bg-[#0a0a0a] ${
        highlight
          ? 'border-[#0066FF]/60 bg-[#0d1117]'
          : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase font-mono tracking-wider text-[#666666] font-semibold">
          {label}
        </span>
        <Icon className="w-4 h-4 text-[#0066FF]/60" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[32px] font-bold font-mono text-[#FFFFFF] leading-none">
          {value}
        </span>
        {subtext && (
          <span className="text-[11px] font-mono text-[#666666] uppercase">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
