import React from 'react';
import { EvidenceArtifact } from '@/lib/types';
import { SourceBadge } from './SourceBadge';
import { CheckCircle2, ShieldCheck, Hash, ExternalLink } from 'lucide-react';

interface Props {
  evidence: EvidenceArtifact[];
}

export const EvidencePanel: React.FC<Props> = ({ evidence }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Why do we believe this? (Corroborating Evidence)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every conclusion is backed by verified infrastructure records, telemetry deviations, or confirmed topologies.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {evidence.length} Artifacts Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200 capitalize">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
              <SourceBadge source={item.source} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {item.summary}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px] text-slate-400 font-mono">
              {item.raw_reference && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ref:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {item.raw_reference}
                  </span>
                </div>
              )}
              {item.hash && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Hash:
                  </span>
                  <span className="text-slate-400 truncate max-w-[200px]" title={item.hash}>
                    {item.hash.substring(0, 19)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
