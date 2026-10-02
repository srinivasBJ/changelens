import React from 'react';
import { EvidenceArtifact } from '@/lib/types';
import { SourceBadge } from './SourceBadge';
import { CheckCircle2, ShieldCheck, Hash, ExternalLink, Lock } from 'lucide-react';

interface Props {
  evidence: EvidenceArtifact[];
}

export const EvidencePanel: React.FC<Props> = ({ evidence }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#222733] pb-2.5">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Corroborating Evidence Artifacts
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Every conclusion is supported by cryptographically hashed infrastructure records, telemetry deviations, and confirmed topologies.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161a22] border border-[#222733] text-emerald-400 font-bold">
          {evidence.length} ARTIFACTS VERIFIED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded border border-[#222733] bg-[#13161c] hover:border-[#2f3747] transition-colors space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 uppercase">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SourceBadge source={item.source} />
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                  VERIFIED
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {item.summary}
            </p>

            <div className="pt-2 border-t border-[#1e232d] flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
              {item.raw_reference && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0">REF:</span>
                  <span className="text-slate-300 truncate max-w-[260px]" title={item.raw_reference}>
                    {item.raw_reference}
                  </span>
                </div>
              )}
              {item.hash && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>SHA-256:</span>
                  </span>
                  <span className="text-slate-400 truncate font-mono" title={item.hash}>
                    {item.hash.substring(0, 24)}...
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
