import React from 'react';
import { OperationalMemory } from '@/lib/types';
import { History, BrainCircuit, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

interface Props {
  memories: OperationalMemory[];
}

export const MemoryPanel: React.FC<Props> = ({ memories }) => {
  return (
    <div className="space-y-[20px]">
      {/* Header Banner - Clear Historical Separation */}
      <div className="p-[20px] rounded-[10px] border border-[#FFB800]/50 bg-[#1f1f1f] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#FFB800]">
            <BrainCircuit className="w-5 h-5 text-[#FFB800]" />
            <h3 className="text-[15px] font-sans font-semibold text-[#D6D6D6]">
              Operational Memory Bank (Powered by Hindsight™)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-sans font-semibold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 shrink-0">
            {memories.length} HISTORICAL MATCHES FOUND
          </span>
        </div>

        <p className="text-[13px] text-[#A8A8A8] leading-[1.55] font-sans">
          ChangeLens queries its dedicated Hindsight memory bank (<code className="font-mono text-[#FFB800] text-[12px]">changelens-operational-memory</code>) to recall past operational incidents with matching telemetry signatures, resource dependencies, and configuration actions.
        </p>

        {/* Operational Guardrail Principle */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#FFB800]/20 text-[12px] font-sans font-semibold text-[#FFB800]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FFB800]" />
          <span>
            OPERATIONAL PRINCIPLE: Historical memories are recalled context to aid investigation, never causal proof of the active incident.
          </span>
        </div>
      </div>

      {/* Recalled Memory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        {memories.map((mem) => {
          const simPct = mem.similarity_score ? Math.round(mem.similarity_score * 100) : 75;

          return (
            <div
              key={mem.id}
              className="p-[20px] rounded-[10px] border border-dashed border-[#FFB800]/50 bg-[#1f1f1f] hover:border-[#FFB800] transition-colors space-y-3 text-[13px] font-sans"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#7A7A7A] font-mono">
                  Incident Date: {new Date(mem.timestamp).toISOString().split('T')[0]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{simPct}% Similarity</span>
                </span>
              </div>

              <div>
                <h4 className="text-[15px] font-semibold text-[#D6D6D6] font-mono">
                  {mem.changed_resource}
                </h4>
                <div className="text-[12px] text-[#FFB800] mt-0.5 font-mono">
                  {mem.change_type} on {mem.affected_service}
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#171717] border border-[#303030] text-[12px] space-y-1 font-mono">
                <span className="text-[11px] uppercase tracking-[0.08em] text-[#7A7A7A] block font-semibold font-sans">
                  Observed Telemetry Signature
                </span>
                <span className="text-[#A8A8A8] break-words">
                  {mem.telemetry_signature}
                </span>
              </div>

              <div className="space-y-1.5 text-[13px] font-sans">
                <div className="flex items-start gap-2 text-[#00FF88]">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#00FF88]" />
                  <div>
                    <span className="font-semibold text-[#D6D6D6]">Resolution: </span>
                    <span className="text-[#A8A8A8]">{mem.outcome}</span>
                  </div>
                </div>
                <div className="text-[13px] text-[#A8A8A8] bg-[#171717] p-3 rounded-[8px] border border-[#303030]">
                  <span className="font-semibold text-[#D6D6D6]">Remediation: </span>
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
