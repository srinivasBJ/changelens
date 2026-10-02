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
      className={`p-3 rounded border transition-colors bg-[#13161c] ${
        highlight
          ? 'border-blue-500/50 bg-[#161a24]'
          : 'border-[#222733] hover:border-[#2f3646]'
      }`}
    >
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
          {label}
        </span>
        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-blue-400' : 'text-slate-500'}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-bold font-mono text-slate-100">{value}</span>
        {subtext && (
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
