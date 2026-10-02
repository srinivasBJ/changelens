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

  const getNodeStyles = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-blue-500 bg-[#16233b] ring-2 ring-blue-500 text-white';
    }

    switch (type.toLowerCase()) {
      case 'change':
        return 'border-blue-800 bg-[#111724] text-blue-300 hover:border-blue-600';
      case 'resource':
        return 'border-emerald-800 bg-[#0f1a16] text-emerald-300 hover:border-emerald-600';
      case 'service':
        return 'border-slate-700 bg-[#141720] text-slate-200 hover:border-slate-500';
      case 'metric':
        return 'border-rose-800 bg-[#1f1214] text-rose-300 hover:border-rose-600';
      case 'agent':
        return 'border-cyan-800 bg-[#0f1b20] text-cyan-300 hover:border-cyan-600';
      default:
        return 'border-[#262c3a] bg-[#13161c] text-slate-300 hover:border-[#384154]';
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Topology Canvas & Edges (8 Cols) */}
      <div className="lg:col-span-8 space-y-3">
        <div className="border border-[#222733] rounded bg-[#13161c] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222733] pb-2.5">
            <div className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Topological Blast Radius Canvas
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {graph.nodes.length} NODES · {graph.edges.length} EDGES
            </span>
          </div>

          {/* Node Grid Canvas */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Topology Nodes (Click node to inspect metadata and impact paths)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {graph.nodes.map((node) => {
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode?.id === node.id;
                const isCenter = node.id === graph.center_node;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`text-left p-3 rounded border transition-colors relative font-mono text-xs ${getNodeStyles(
                      node.type,
                      isSelected
                    )}`}
                  >
                    {isCenter && (
                      <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[8px] font-bold bg-blue-600 text-white uppercase">
                        Center
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1 opacity-75">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">
                        {node.type}
                      </span>
                    </div>
                    <div className="font-bold text-slate-100 truncate text-[11px]" title={node.label}>
                      {node.label}
                    </div>
                    {node.severity && (
                      <div className="mt-1 text-[9px] flex items-center gap-1 text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>SEVERITY: {node.severity.toFixed(2)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dependency Edges List */}
          <div className="pt-3 border-t border-[#222733] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Dependency Edges & Corroborating Evidence
            </div>
            <div className="space-y-1">
              {graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-[#0d0f12] border border-[#1f242e] text-[11px] font-mono gap-1"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-blue-400 font-bold">{edge.source}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-200">{edge.target}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e232d] text-slate-300 uppercase">
                      {edge.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[280px]">
                    {edge.evidence.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Inspector Detail Panel (4 Cols) */}
      <div className="lg:col-span-4 space-y-3">
        <div className="border border-[#222733] rounded bg-[#13161c] p-4 space-y-4 sticky top-4">
          <div className="flex items-center justify-between border-b border-[#222733] pb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Node Inspector
            </span>
            {selectedNode && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1e232d] text-blue-300 uppercase">
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Identifier / Label</span>
                <span className="font-bold text-slate-100 text-sm break-all">
                  {selectedNode.label}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  ID: {selectedNode.id}
                </span>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-slate-400 block">Metadata</span>
                  <div className="p-2.5 rounded bg-[#0d0f12] border border-[#1f242e] text-[11px] space-y-1">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 text-right truncate max-w-[180px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-slate-400 block">
                  Connected Relationships ({relevantEdges.length})
                </span>
                <div className="space-y-1">
                  {relevantEdges.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[#0d0f12] border border-[#1f242e] text-[11px] space-y-0.5"
                    >
                      <div className="text-blue-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{e.source === selectedNode.id ? `➔ ${e.target}` : `⬅ ${e.source}`}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        REL: {e.label} (weight: {e.weight})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              Select a node in the graph to inspect metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
