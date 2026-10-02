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
      className={`p-[20px] rounded-[10px] border transition-colors bg-[#1f1f1f] ${
        highlight
          ? 'border-[#0066FF]/60 bg-[#1a2b42]'
          : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-sans font-semibold tracking-[0.08em] text-[#888888]">
          {label}
        </span>
        <Icon className="w-4 h-4 text-[#0066FF]/60" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[32px] font-sans font-bold text-[#FFFFFF] leading-[1.2] tracking-[-0.02em] tabular">
          {value}
        </span>
        {subtext && (
          <span className="text-[12px] font-sans font-medium text-[#888888]">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
