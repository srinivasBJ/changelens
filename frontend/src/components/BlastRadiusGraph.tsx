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
    let baseBorder = 'border-[#3a3a3a]';
    let textColor = 'text-[#D6D6D6]';

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
        textColor = 'text-[#A8A8A8]';
        break;
      case 'agent':
        baseBorder = 'border-[#A8A8A8]';
        textColor = 'text-[#A8A8A8]';
        break;
      default:
        baseBorder = 'border-[#3a3a3a]';
        textColor = 'text-[#A8A8A8]';
    }

    if (isSelected) {
      return `${baseBorder} border-2 bg-[#1a2b42] ring-1 ring-[#0066FF] shadow-[0_0_20px_rgba(0,102,255,0.3)] ${textColor}`;
    }

    return `${baseBorder} border bg-[#171717] hover:bg-[#222222] ${textColor}`;
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
        <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-[20px]">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#0066FF]" />
              <h3 className="text-[15px] font-sans font-semibold text-[#D6D6D6]">
                Topological Blast Radius Canvas
              </h3>
            </div>
            <span className="text-[12px] font-mono text-[#7A7A7A] tabular">
              {graph.nodes.length} NODES · {graph.edges.length} EDGES
            </span>
          </div>

          {/* Node Grid Canvas */}
          <div className="space-y-3">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">
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
                      <span className="text-[10px] uppercase tracking-wider font-semibold font-sans">
                        {node.type}
                      </span>
                    </div>
                    <div className="font-semibold text-[#D6D6D6] truncate text-[12px]" title={node.label}>
                      {node.label}
                    </div>
                    {node.severity && (
                      <div className="mt-1.5 text-[10px] flex items-center gap-1 text-[#FF3366] tabular">
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
          <div className="pt-4 border-t border-[#3a3a3a] space-y-2.5">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">
              Dependency Edges & Corroborating Evidence
            </div>
            <div className="space-y-1.5">
              {graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-[8px] bg-[#171717] border border-[#303030] text-[12px] font-mono gap-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#0066FF] font-bold">{edge.source}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#7A7A7A]" />
                    <span className="text-[#D6D6D6]">{edge.target}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#A8A8A8] uppercase border border-[#3a3a3a]">
                      {edge.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A8A8A8] truncate max-w-[300px]">
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
        <div className="border border-[#3a3a3a] rounded-[10px] bg-[#1f1f1f] p-[20px] space-y-[20px] sticky top-6">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-3">
            <h3 className="text-[15px] font-sans font-semibold text-[#D6D6D6]">
              Node Inspector
            </h3>
            {selectedNode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#171717] text-[#0066FF] border border-[#3a3a3a] uppercase font-bold">
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-[13px] font-sans">
              <div>
                <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#7A7A7A] block mb-1">
                  Identifier / Label
                </span>
                <span className="font-semibold text-[#D6D6D6] text-[15px] font-mono break-all">
                  {selectedNode.label}
                </span>
                <span className="text-[11px] font-mono text-[#7A7A7A] block mt-1 truncate">
                  ID: {selectedNode.id}
                </span>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#7A7A7A] block">
                    Metadata
                  </span>
                  <div className="p-3 rounded-[8px] bg-[#171717] border border-[#303030] text-[12px] space-y-1.5 font-mono">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-[#242424] pb-1 last:border-0 last:pb-0">
                        <span className="text-[#7A7A7A]">{k}:</span>
                        <span className="text-[#D6D6D6] text-right truncate max-w-[180px] font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#7A7A7A] block">
                  Connected Relationships ({relevantEdges.length})
                </span>
                <div className="space-y-1.5">
                  {relevantEdges.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[8px] bg-[#171717] border border-[#303030] text-[12px] space-y-1"
                    >
                      <div className="text-[#0066FF] font-semibold flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88]" />
                        <span>{e.source === selectedNode.id ? `➔ ${e.target}` : `⬅ ${e.source}`}</span>
                      </div>
                      <div className="text-[11px] text-[#A8A8A8]">
                        Rel: {e.label} (weight: {e.weight})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] font-sans text-[#7A7A7A]">
              Select a node in the graph to inspect metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
