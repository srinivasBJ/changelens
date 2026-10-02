import React, { useState } from 'react';
import { BlastRadiusGraph as GraphType, GraphNode } from '@/lib/types';
import { Network, Layers, ShieldAlert, Cpu, ArrowRight, Activity, Database, CheckCircle2 } from 'lucide-react';

interface Props {
  graph: GraphType;
}

export const BlastRadiusGraph: React.FC<Props> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    graph.nodes.find((n) => n.id === graph.center_node) || graph.nodes[0] || null
  );

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Topology Canvas & Edges (8 Cols) */}
      <div className="lg:col-span-8 space-y-5">
        <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[#2A2A2F] pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#58A6FF]" />
              <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC]">
                Topological Blast Radius Canvas
              </h3>
            </div>
            <span className="text-[12px] font-mono text-[#71717A] tabular">
              {graph.nodes.length} NODES · {graph.edges.length} EDGES
            </span>
          </div>

          {/* Node Grid Canvas */}
          <div className="space-y-3">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
              Topology Nodes (Select node to inspect metadata and impact paths)
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
                    className={`text-left p-3.5 rounded-[6px] transition-colors duration-150 relative font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${
                      isSelected
                        ? 'bg-[#2F6FAD] border border-[#58A6FF] text-[#FFFFFF] shadow-sm'
                        : 'bg-[#1E1E22] border border-[#2A2A2F] text-[#ECECEC] hover:bg-[rgba(88,166,255,0.10)] hover:border-[#3F3F46]'
                    }`}
                  >
                    {isCenter && (
                      <span className={`absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isSelected ? 'bg-[#FFFFFF] text-[#2F6FAD]' : 'bg-[#2F6FAD] text-[#FFFFFF]'
                      }`}>
                        Center
                      </span>
                    )}
                    <div className={`flex items-center gap-1.5 mb-1.5 ${isSelected ? 'text-[#D9E6F2]' : 'text-[#71717A]'}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold font-sans">
                        {node.type}
                      </span>
                    </div>
                    <div className={`font-semibold truncate text-[12px] ${isSelected ? 'text-[#FFFFFF]' : 'text-[#ECECEC]'}`} title={node.label}>
                      {node.label}
                    </div>
                    {node.severity && (
                      <div className={`mt-1.5 text-[10px] flex items-center gap-1 tabular ${isSelected ? 'text-[#FFFFFF]' : 'text-[#F85149]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#FFFFFF]' : 'bg-[#F85149]'}`} />
                        <span>SEVERITY: {node.severity.toFixed(2)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dependency Edges List */}
          <div className="pt-4 border-t border-[#2A2A2F] space-y-2.5">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-[#71717A]">
              Dependency Edges & Corroborating Evidence
            </div>
            <div className="space-y-1.5">
              {graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] font-mono gap-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#58A6FF] font-bold">{edge.source}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A]" />
                    <span className="text-[#ECECEC]">{edge.target}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#121214] text-[#A1A1AA] uppercase border border-[#2A2A2F]">
                      {edge.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#71717A] truncate max-w-[300px]">
                    {edge.evidence.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Inspector Detail Panel (4 Cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="border border-[#2A2A2F] rounded-[10px] bg-[#17171A] p-5 space-y-5 sticky top-6">
          <div className="flex items-center justify-between border-b border-[#2A2A2F] pb-3">
            <h3 className="text-[15px] font-sans font-semibold text-[#ECECEC]">
              Node Inspector
            </h3>
            {selectedNode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E1E22] text-[#58A6FF] border border-[#2A2A2F] uppercase font-bold">
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-[13px] font-sans">
              <div>
                <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#71717A] block mb-1">
                  Identifier / Label
                </span>
                <span className="font-semibold text-[#ECECEC] text-[14px] font-mono break-all">
                  {selectedNode.label}
                </span>
                <span className="text-[11px] font-mono text-[#71717A] block mt-1 truncate">
                  ID: {selectedNode.id}
                </span>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#71717A] block">
                    Metadata
                  </span>
                  <div className="p-3 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] space-y-1.5 font-mono">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-[#121214] pb-1 last:border-0 last:pb-0">
                        <span className="text-[#71717A]">{k}:</span>
                        <span className="text-[#ECECEC] text-right truncate max-w-[180px] font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#71717A] block">
                  Connected Relationships ({relevantEdges.length})
                </span>
                <div className="space-y-1.5">
                  {relevantEdges.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] space-y-1"
                    >
                      <div className="text-[#58A6FF] font-semibold flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />
                        <span>{e.source === selectedNode.id ? `➔ ${e.target}` : `⬅ ${e.source}`}</span>
                      </div>
                      <div className="text-[11px] text-[#71717A]">
                        Rel: {e.label} (weight: {e.weight})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] font-sans text-[#71717A]">
              Select a node in the graph to inspect metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
