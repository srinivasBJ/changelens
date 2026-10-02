import React, { useState } from 'react';
import { BlastRadiusGraph as GraphType, GraphNode, GraphEdge } from '@/lib/types';
import { Network, Layers, ShieldAlert, Cpu, ArrowRight, Activity, Database, CheckCircle2 } from 'lucide-react';

interface Props {
  graph: GraphType;
}

export const BlastRadiusGraph: React.FC<Props> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    graph.nodes.find((n) => n.id === graph.center_node) || graph.nodes[0] || null
  );

  const getNodeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'change':
        return 'border-blue-500 bg-blue-950/60 text-blue-300';
      case 'resource':
        return 'border-emerald-500 bg-emerald-950/60 text-emerald-300';
      case 'service':
        return 'border-purple-500 bg-purple-950/60 text-purple-300';
      case 'operation':
        return 'border-orange-500 bg-orange-950/60 text-orange-300';
      case 'metric':
        return 'border-rose-500 bg-rose-950/60 text-rose-300';
      case 'agent':
        return 'border-cyan-500 bg-cyan-950/60 text-cyan-300';
      default:
        return 'border-slate-600 bg-slate-900 text-slate-300';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'change':
        return Activity;
      case 'resource':
        return Database;
      case 'service':
        return Layers;
      case 'operation':
        return ArrowRight;
      case 'metric':
        return ShieldAlert;
      case 'agent':
        return Cpu;
      default:
        return Network;
    }
  };

  // Find incoming & outgoing edges for selected node
  const relevantEdges = selectedNode
    ? graph.edges.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id
      )
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Topological Pipeline */}
      <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Topological Blast Radius
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {graph.nodes.length} Nodes · {graph.edges.length} Dependency Edges
          </span>
        </div>

        {/* Node Grid Layout */}
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Infrastructure & Telemetry Impact Path
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {graph.nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode?.id === node.id;
              const isCenter = node.id === graph.center_node;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all duration-200 relative ${getNodeColor(
                    node.type
                  )} ${
                    isSelected
                      ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-lg'
                      : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                >
                  {isCenter && (
                    <span className="absolute -top-2.5 right-2 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500 text-white uppercase shadow">
                      Center
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                      {node.type}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-100 truncate">
                    {node.label}
                  </div>
                  {node.severity && (
                    <div className="mt-2 text-[10px] flex items-center gap-1 font-mono text-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Severity: {node.severity.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Edge Evidence List */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Dependency Edges & Corroborating Evidence
          </div>
          <div className="space-y-1.5">
            {graph.edges.map((edge, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-indigo-300 font-semibold">{edge.source}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-300">{edge.target}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-sans">
                    {edge.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {edge.evidence.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Node Inspector Detail Panel */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Node Inspector
          </span>
          {selectedNode && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono uppercase">
              {selectedNode.type}
            </span>
          )}
        </div>

        {selectedNode ? (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Identifier</span>
              <span className="font-mono text-sm font-bold text-slate-100">
                {selectedNode.label}
              </span>
            </div>

            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-400 text-[11px] block">Metadata</span>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[11px] space-y-1">
                  {Object.entries(selectedNode.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-slate-400 text-[11px] block">
                Connected Impact Relationships ({relevantEdges.length})
              </span>
              <div className="space-y-1.5">
                {relevantEdges.map((e, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-950/50 border border-slate-800 text-[11px] space-y-1"
                  >
                    <div className="font-mono text-indigo-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {e.source === selectedNode.id ? `To: ${e.target}` : `From: ${e.source}`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Relationship: {e.label} (weight: {e.weight})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Select a node in the graph to inspect metadata and impact paths.
          </div>
        )}
      </div>
    </div>
  );
};
