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
      <div className="p-[20px] rounded-[10px] border border-[#FFB800]/50 bg-[#0a0a0a] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#FFB800]">
            <BrainCircuit className="w-5 h-5 text-[#FFB800]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-[1px]">
              Operational Memory Bank (Powered by Hindsight™)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 shrink-0">
            {memories.length} HISTORICAL MATCHES FOUND
          </span>
        </div>

        <p className="text-xs text-[#A0A0A0] leading-relaxed font-sans">
          ChangeLens queries its dedicated Hindsight memory bank (<code className="font-mono text-[#FFB800]">changelens-operational-memory</code>) to recall past operational incidents with matching telemetry signatures, resource dependencies, and configuration actions.
        </p>

        {/* Operational Guardrail Principle */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#FFB800]/20 text-xs font-mono font-bold text-[#FFB800]">
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
              className="p-[20px] rounded-[10px] border border-dashed border-[#FFB800]/50 bg-[#0a0a0a] hover:border-[#FFB800] transition-colors space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#666666]">
                  INCIDENT DATE: {new Date(mem.timestamp).toISOString().split('T')[0]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{simPct}% SIMILARITY</span>
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-[#FFFFFF]">
                  {mem.changed_resource}
                </div>
                <div className="text-xs text-[#FFB800] mt-0.5">
                  {mem.change_type} on {mem.affected_service}
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#111111] border border-[#2a2a2a] text-xs space-y-1">
                <span className="text-[10px] uppercase tracking-[1px] text-[#666666] block font-semibold">
                  Observed Telemetry Signature
                </span>
                <span className="text-[#A0A0A0] break-words">
                  {mem.telemetry_signature}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <div className="flex items-start gap-2 text-[#00FF88]">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#00FF88]" />
                  <div>
                    <span className="font-semibold text-[#FFFFFF]">Resolution: </span>
                    <span className="text-[#A0A0A0]">{mem.outcome}</span>
                  </div>
                </div>
                <div className="text-xs text-[#A0A0A0] bg-[#111111] p-3 rounded-[8px] border border-[#2a2a2a]">
                  <span className="font-semibold text-[#FFFFFF]">Remediation: </span>
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
