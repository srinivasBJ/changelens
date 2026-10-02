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
      className={`min-h-[96px] p-4 rounded-[10px] border transition-colors flex flex-col justify-between ${
        highlight
          ? 'border-[#2F6FAD] bg-[#17171A]'
          : 'border-[#2A2A2F] bg-[#17171A] hover:border-[#3F3F46]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-sans font-semibold tracking-[0.06em] text-[#71717A]">
          {label}
        </span>
        <Icon className="w-4 h-4 text-[#58A6FF]/70" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[28px] font-sans font-bold text-[#FFFFFF] leading-none tracking-tight tabular">
          {value}
        </span>
        {subtext && (
          <span className="text-[12px] font-sans font-medium text-[#71717A]">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
