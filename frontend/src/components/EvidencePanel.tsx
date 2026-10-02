import React from 'react';
import { EvidenceArtifact } from '@/lib/types';
import { SourceBadge } from './SourceBadge';
import { CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

interface Props {
  evidence: EvidenceArtifact[];
}

export const EvidencePanel: React.FC<Props> = ({ evidence }) => {
  return (
    <div className="space-y-[20px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2a2a2a] pb-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-[1px] text-[#FFFFFF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            Corroborating Evidence Artifacts
          </h3>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Every conclusion is supported by cryptographically hashed infrastructure records, telemetry deviations, and confirmed topologies.
          </p>
        </div>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/30 text-[#00FF88] font-bold">
          {evidence.length} ARTIFACTS VERIFIED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="p-[20px] rounded-[10px] border border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a] transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88] shrink-0" />
                <span className="font-bold text-[#FFFFFF] uppercase">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SourceBadge source={item.source} />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold">
                  VERIFIED
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A0A0A0] leading-relaxed font-sans">
              {item.summary}
            </p>

            <div className="pt-3 border-t border-[#1a1a1a] flex flex-col gap-1.5 text-xs text-[#A0A0A0] font-mono">
              {item.raw_reference && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#666666] shrink-0">REF:</span>
                  <span className="text-[#FFFFFF] truncate max-w-[280px]" title={item.raw_reference}>
                    {item.raw_reference}
                  </span>
                </div>
              )}
              {item.hash && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#666666] shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#00FF88]" />
                    <span>SHA-256:</span>
                  </span>
                  <span className="text-[#A0A0A0] truncate font-mono text-[11px]" title={item.hash}>
                    {item.hash.substring(0, 28)}...
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
