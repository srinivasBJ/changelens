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
      className={`p-4 rounded-xl border transition-all duration-200 bg-slate-900/70 hover:bg-slate-900 ${
        highlight
          ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {label}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/80 text-indigo-400 border border-slate-700/50">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-slate-100">{value}</span>
        {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
};
