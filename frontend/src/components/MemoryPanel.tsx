import React from 'react';
import { OperationalMemory } from '@/lib/types';
import { BrainCircuit, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

interface Props {
  memories: OperationalMemory[];
}

export const MemoryPanel: React.FC<Props> = ({ memories }) => {
  return (
    <div className="space-y-5">
      {/* Header Banner - Clear Historical Separation */}
      <div className="p-5 rounded-[10px] border border-dashed border-[rgba(210,153,34,0.4)] bg-[#17171A] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#D29922]">
            <BrainCircuit className="w-5 h-5 text-[#D29922]" />
            <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC]">
              Operational Memory Bank (Powered by Hindsight™)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-sans font-semibold bg-[rgba(210,153,34,0.15)] text-[#D29922] border border-[rgba(210,153,34,0.3)] shrink-0">
            {memories.length} HISTORICAL MATCHES FOUND
          </span>
        </div>

        <p className="text-[13px] text-[#A1A1AA] leading-[1.55] font-sans">
          ChangeLens queries its dedicated Hindsight memory bank (<code className="font-mono text-[#D29922] text-[12px]">changelens-operational-memory</code>) to recall past operational incidents with matching telemetry signatures, resource dependencies, and configuration actions.
        </p>

        {/* Operational Guardrail Principle */}
        <div className="flex items-center gap-2 pt-2 border-t border-[rgba(210,153,34,0.2)] text-[12px] font-sans font-semibold text-[#D29922]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#D29922]" />
          <span>
            OPERATIONAL PRINCIPLE: Historical memories are recalled context to aid investigation, never causal proof of the active incident.
          </span>
        </div>
      </div>

      {/* Recalled Memory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((mem) => {
          const simPct = mem.similarity_score ? Math.round(mem.similarity_score * 100) : 75;

          return (
            <div
              key={mem.id}
              className="p-5 rounded-[10px] border border-dashed border-[rgba(210,153,34,0.4)] bg-[#17171A] hover:border-[#D29922] transition-colors space-y-3 text-[13px] font-sans"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#71717A] font-mono">
                  Incident Date: {new Date(mem.timestamp).toISOString().split('T')[0]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-[rgba(210,153,34,0.15)] text-[#D29922] border border-[rgba(210,153,34,0.3)] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{simPct}% Similarity</span>
                </span>
              </div>

              <div>
                <h4 className="text-[15px] font-semibold text-[#ECECEC] font-mono">
                  {mem.changed_resource}
                </h4>
                <div className="text-[12px] text-[#D29922] mt-0.5 font-mono">
                  {mem.change_type} on {mem.affected_service}
                </div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] space-y-1 font-mono">
                <span className="text-[11px] uppercase tracking-[0.06em] text-[#71717A] block font-semibold font-sans">
                  Observed Telemetry Signature
                </span>
                <span className="text-[#A1A1AA] break-words">
                  {mem.telemetry_signature}
                </span>
              </div>

              <div className="space-y-1.5 text-[13px] font-sans">
                <div className="flex items-start gap-2 text-[#3FB950]">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#3FB950]" />
                  <div>
                    <span className="font-semibold text-[#ECECEC]">Resolution: </span>
                    <span className="text-[#A1A1AA]">{mem.outcome}</span>
                  </div>
                </div>
                <div className="text-[13px] text-[#A1A1AA] bg-[#1E1E22] p-3 rounded-[6px] border border-[#2A2A2F]">
                  <span className="font-semibold text-[#ECECEC]">Remediation: </span>
                  {mem.remediation}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
