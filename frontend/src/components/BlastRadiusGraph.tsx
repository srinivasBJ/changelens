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
    let baseBorder = 'border-[#2a2a2a]';
    let textColor = 'text-[#FFFFFF]';

    switch (type.toLowerCase()) {
      case 'change':
        baseBorder = 'border-[#FF3366]';
        textColor = 'text-[#FF3366]';
        break;
      case 'resource':
        baseBorder = 'border-[#0066FF]';
        textColor = 'text-[#0066FF]';
        break;
      case 'metric':
        baseBorder = 'border-[#FFB800]';
        textColor = 'text-[#FFB800]';
        break;
      case 'service':
        baseBorder = 'border-[#0066FF]/60';
        textColor = 'text-[#A0A0A0]';
        break;
      case 'agent':
        baseBorder = 'border-[#A0A0A0]';
        textColor = 'text-[#A0A0A0]';
        break;
      default:
        baseBorder = 'border-[#2a2a2a]';
        textColor = 'text-[#A0A0A0]';
    }

    if (isSelected) {
      return `${baseBorder} border-2 bg-[#0d1117] ring-1 ring-[#0066FF] shadow-[0_0_20px_rgba(0,102,255,0.3)] ${textColor}`;
    }

    return `${baseBorder} border bg-[#0a0a0a] hover:bg-[#111111] ${textColor}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px]">
      {/* Topology Canvas & Edges (8 Cols) */}
      <div className="lg:col-span-8 space-y-[20px]">
        <div className="border border-[#2a2a2a] rounded-[10px] bg-[#0a0a0a] p-[20px] space-y-[20px]">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#0066FF]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFFFFF]">
                Topological Blast Radius Canvas
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#666666]">
              {graph.nodes.length} NODES · {graph.edges.length} EDGES
            </span>
          </div>

          {/* Node Grid Canvas */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666]">
              Topology Nodes (Click node to inspect metadata and impact paths)
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
                    className={`text-left p-3.5 rounded-[8px] transition-all relative font-mono text-xs ${getNodeStyles(
                      node.type,
                      isSelected
                    )}`}
                  >
                    {isCenter && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0066FF] text-[#FFFFFF] uppercase">
                        Center
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {node.type}
                      </span>
                    </div>
                    <div className="font-bold text-[#FFFFFF] truncate text-xs" title={node.label}>
                      {node.label}
                    </div>
                    {node.severity && (
                      <div className="mt-1.5 text-[10px] flex items-center gap-1 text-[#FF3366]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366]" />
                        <span>SEVERITY: {node.severity.toFixed(2)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dependency Edges List */}
          <div className="pt-4 border-t border-[#2a2a2a] space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#666666]">
              Dependency Edges & Corroborating Evidence
            </div>
            <div className="space-y-1.5">
              {graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] text-xs font-mono gap-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#0066FF] font-bold">{edge.source}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#666666]" />
                    <span className="text-[#FFFFFF]">{edge.target}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#A0A0A0] uppercase border border-[#2a2a2a]">
                      {edge.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] truncate max-w-[300px]">
                    {edge.evidence.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Inspector Detail Panel (4 Cols) */}
      <div className="lg:col-span-4 space-y-[20px]">
        <div className="border border-[#2a2a2a] rounded-[10px] bg-[#0a0a0a] p-[20px] space-y-[20px] sticky top-6">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[1px] text-[#666666]">
              Node Inspector
            </span>
            {selectedNode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#0066FF] border border-[#2a2a2a] uppercase font-bold">
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-[11px] uppercase tracking-[1px] text-[#666666] block mb-1">
                  Identifier / Label
                </span>
                <span className="font-bold text-[#FFFFFF] text-sm break-all">
                  {selectedNode.label}
                </span>
                <span className="text-[11px] text-[#666666] block mt-1 truncate">
                  ID: {selectedNode.id}
                </span>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[1px] text-[#666666] block">
                    Metadata
                  </span>
                  <div className="p-3 rounded-[8px] bg-[#111111] border border-[#2a2a2a] text-xs space-y-1.5">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-[#1a1a1a] pb-1 last:border-0 last:pb-0">
                        <span className="text-[#666666]">{k}:</span>
                        <span className="text-[#FFFFFF] text-right truncate max-w-[180px] font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-[1px] text-[#666666] block">
                  Connected Relationships ({relevantEdges.length})
                </span>
                <div className="space-y-1.5">
                  {relevantEdges.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[8px] bg-[#111111] border border-[#2a2a2a] text-xs space-y-1"
                    >
                      <div className="text-[#0066FF] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88]" />
                        <span>{e.source === selectedNode.id ? `➔ ${e.target}` : `⬅ ${e.source}`}</span>
                      </div>
                      <div className="text-[11px] text-[#A0A0A0]">
                        REL: {e.label} (weight: {e.weight})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-[#666666]">
              Select a node in the graph to inspect metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
