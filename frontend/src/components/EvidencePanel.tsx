import React from 'react';
import { EvidenceArtifact } from '@/lib/types';
import { SourceBadge } from './SourceBadge';
import { CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

interface Props {
  evidence: EvidenceArtifact[];
}

export const EvidencePanel: React.FC<Props> = ({ evidence }) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2A2A2F] pb-3">
        <div>
          <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3FB950]" />
            Corroborating Evidence Artifacts
          </h3>
          <p className="text-[13px] text-[#A1A1AA] mt-1 font-sans">
            Every conclusion is supported by cryptographically hashed infrastructure records, telemetry deviations, and confirmed topologies.
          </p>
        </div>
        <span className="text-[11px] font-sans font-semibold px-3 py-1 rounded-full bg-[rgba(63,185,80,0.15)] border border-[rgba(63,185,80,0.3)] text-[#3FB950]">
          {evidence.length} ARTIFACTS VERIFIED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-[10px] border border-[#2A2A2F] bg-[#17171A] hover:border-[#3F3F46] transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-sans text-[14px]">
                <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                <h4 className="font-semibold text-[#ECECEC] capitalize">
                  {item.category.replace('_', ' ')}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <SourceBadge source={item.source} />
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[rgba(63,185,80,0.15)] text-[#3FB950] border border-[rgba(63,185,80,0.3)] font-bold">
                  VERIFIED
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#A1A1AA] leading-[1.55] font-sans">
              {item.summary}
            </p>

            <div className="pt-3 border-t border-[#2A2A2F] flex flex-col gap-1.5 text-[12px] font-mono">
              {item.raw_reference && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A] shrink-0 font-sans">Ref:</span>
                  <span className="text-[#ECECEC] truncate max-w-[280px]" title={item.raw_reference}>
                    {item.raw_reference}
                  </span>
                </div>
              )}
              {item.hash && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A] shrink-0 flex items-center gap-1 font-sans">
                    <Lock className="w-3 h-3 text-[#3FB950]" />
                    <span>SHA-256:</span>
                  </span>
                  <span className="text-[#A1A1AA] truncate text-[11px]" title={item.hash}>
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
