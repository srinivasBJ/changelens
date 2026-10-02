import React from 'react';
import { OperationalMemory } from '@/lib/types';
import { History, BrainCircuit, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

interface Props {
  memories: OperationalMemory[];
}

export const MemoryPanel: React.FC<Props> = ({ memories }) => {
  return (
    <div className="space-y-4">
      {/* Header Banner - Clear Historical Separation */}
      <div className="p-3.5 rounded border border-amber-700/40 bg-[#17140e] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-300">
            <BrainCircuit className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              Operational Memory Bank (Powered by Hindsight™)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 shrink-0">
            {memories.length} HISTORICAL MATCHES FOUND
          </span>
        </div>

        <p className="text-xs text-amber-200/80 leading-relaxed font-sans">
          ChangeLens queries its dedicated Hindsight memory bank (<code className="font-mono text-amber-300">changelens-operational-memory</code>) to recall past operational incidents with matching telemetry signatures, resource dependencies, and configuration actions.
        </p>

        {/* Operational Guardrail Principle */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-amber-800/40 text-[10px] font-mono font-bold text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            OPERATIONAL PRINCIPLE: Historical memories are recalled context to aid investigation, never causal proof of the active incident.
          </span>
        </div>
      </div>

      {/* Recalled Memory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {memories.map((mem) => {
          const simPct = mem.similarity_score ? Math.round(mem.similarity_score * 100) : 75;

          return (
            <div
              key={mem.id}
              className="p-3.5 rounded border border-dashed border-amber-600/40 bg-[#13161c] hover:border-amber-500/60 transition-colors space-y-2.5 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  INCIDENT DATE: {new Date(mem.timestamp).toISOString().split('T')[0]}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{simPct}% SIMILARITY</span>
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-200">
                  {mem.changed_resource}
                </div>
                <div className="text-[11px] text-amber-400">
                  {mem.change_type} on {mem.affected_service}
                </div>
              </div>

              <div className="p-2 rounded bg-[#0d0f12] border border-[#1f242e] text-[11px] space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Observed Telemetry Signature
                </span>
                <span className="text-slate-300 break-words">
                  {mem.telemetry_signature}
                </span>
              </div>

              <div className="space-y-1 text-[11px] font-sans">
                <div className="flex items-start gap-1.5 text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-300">Resolution: </span>
                    <span className="text-slate-400">{mem.outcome}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 bg-[#0d0f12] p-2 rounded border border-[#1f242e]">
                  <span className="font-semibold text-slate-300">Remediation: </span>
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
