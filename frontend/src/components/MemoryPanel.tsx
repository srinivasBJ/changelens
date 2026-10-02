import React from 'react';
import { OperationalMemory } from '@/lib/types';
import { History, BrainCircuit, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface Props {
  memories: OperationalMemory[];
}

export const MemoryPanel: React.FC<Props> = ({ memories }) => {
  return (
    <div className="space-y-5">
      {/* Header with Hindsight Differentiation */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300">
            <BrainCircuit className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Operational Memory (Powered by Hindsight™)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {memories.length} Historical Incidents Found
          </span>
        </div>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          ChangeLens queries its dedicated Hindsight memory bank (<code className="font-mono text-amber-300">changelens-operational-memory</code>) to recall past operational incidents with matching telemetry signatures, resource dependencies, and configuration actions.
        </p>

        {/* Critical Disclaimer Required by Prompt */}
        <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20 text-[11px] font-semibold text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
              className="p-5 rounded-xl border-2 border-dashed border-amber-500/40 bg-slate-900/90 hover:border-amber-500/70 transition-all space-y-3 relative overflow-hidden"
            >
              {/* Top Banner */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Previous Incident: {new Date(mem.timestamp).toISOString().split('T')[0]}
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3 h-3" />
                  {simPct}% Similarity
                </div>
              </div>

              {/* Resource & Change */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-200">
                  {mem.changed_resource}
                </div>
                <div className="text-[11px] text-amber-400 font-mono">
                  {mem.change_type} on {mem.affected_service}
                </div>
              </div>

              {/* Observed Symptoms */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Observed Telemetry Signature
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {mem.telemetry_signature}
                </span>
              </div>

              {/* Outcome & Runbook Learnings */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-1.5 text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-300">Resolution: </span>
                    <span className="text-slate-400">{mem.outcome}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800/80">
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
