import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BlastRadiusGraph as GraphType, GraphNode, GraphEdge } from '@/lib/types';
import {
  Network, Layers, ShieldAlert, Cpu, ArrowRight, Activity,
  Database, CheckCircle2, Zap, Globe, AlertTriangle,
} from 'lucide-react';

interface Props {
  graph: GraphType;
}

/* ─── AWS Service Identity Colors ─── */
const AWS_SERVICE_COLORS: Record<string, { accent: string; bg: string; border: string; label: string }> = {
  lambda:       { accent: '#FF9900', bg: 'rgba(255,153,0,0.08)',  border: 'rgba(255,153,0,0.25)',  label: 'AWS Lambda' },
  apigateway:   { accent: '#A166FF', bg: 'rgba(161,102,255,0.08)', border: 'rgba(161,102,255,0.25)', label: 'API Gateway' },
  'api gateway':{ accent: '#A166FF', bg: 'rgba(161,102,255,0.08)', border: 'rgba(161,102,255,0.25)', label: 'API Gateway' },
  dynamodb:     { accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  label: 'DynamoDB' },
  cloudwatch:   { accent: '#3FB950', bg: 'rgba(63,185,80,0.08)',   border: 'rgba(63,185,80,0.25)',   label: 'CloudWatch' },
  cloudtrail:   { accent: '#58A6FF', bg: 'rgba(88,166,255,0.08)',  border: 'rgba(88,166,255,0.25)',  label: 'CloudTrail' },
  iam:          { accent: '#D29922', bg: 'rgba(210,153,34,0.08)',  border: 'rgba(210,153,34,0.25)',  label: 'IAM' },
};

function resolveAwsService(node: GraphNode): { key: string; colors: typeof AWS_SERVICE_COLORS[string] | null } {
  const label = node.label.toLowerCase();
  const service = (node.metadata?.service as string || '').toLowerCase();

  // Metric nodes → CloudWatch
  if (node.type === 'metric') return { key: 'cloudwatch', colors: AWS_SERVICE_COLORS.cloudwatch };
  // Change nodes → CloudTrail
  if (node.type === 'change') return { key: 'cloudtrail', colors: AWS_SERVICE_COLORS.cloudtrail };

  // Resource/service nodes — infer from metadata or label
  if (service === 'lambda' || label.includes('function')) return { key: 'lambda', colors: AWS_SERVICE_COLORS.lambda };
  if (service === 'dynamodb' || label.includes('table')) return { key: 'dynamodb', colors: AWS_SERVICE_COLORS.dynamodb };
  if (label.includes('api') || label.includes('gateway')) return { key: 'apigateway', colors: AWS_SERVICE_COLORS.apigateway };

  return { key: service || 'unknown', colors: null };
}

function getNodeIcon(type: string, awsKey: string) {
  if (awsKey === 'lambda') return Zap;
  if (awsKey === 'apigateway' || awsKey === 'api gateway') return Globe;
  if (awsKey === 'dynamodb') return Database;
  if (awsKey === 'cloudwatch') return AlertTriangle;
  if (awsKey === 'cloudtrail') return Activity;

  switch (type.toLowerCase()) {
    case 'change': return Activity;
    case 'resource': return Database;
    case 'service': return Layers;
    case 'metric': return ShieldAlert;
    case 'agent': return Cpu;
    default: return Network;
  }
}

function getTypeLabel(node: GraphNode): string {
  switch (node.type) {
    case 'change': return 'CHANGE EVENT';
    case 'resource': return 'RESOURCE';
    case 'service': return 'SERVICE';
    case 'metric': return 'TELEMETRY ANOMALY';
    case 'agent': return 'AGENT';
    default: return node.type.toUpperCase();
  }
}

/* ─── Graph Traversal Helpers ─── */
function getConnectedNodeIds(nodeId: string, edges: GraphEdge[]): Set<string> {
  const connected = new Set<string>();
  edges.forEach((e) => {
    if (e.source === nodeId) connected.add(e.target);
    if (e.target === nodeId) connected.add(e.source);
  });
  return connected;
}

/** Build full causal path: walk upstream (sources) and downstream (targets) */
function getCausalPath(nodeId: string, edges: GraphEdge[]): Set<string> {
  const pathNodes = new Set<string>();
  const pathEdgeKeys = new Set<string>();

  // Walk downstream (node → target → target...)
  const walkDown = (current: string) => {
    edges.forEach((e) => {
      if (e.source === current && !pathNodes.has(e.target)) {
        pathNodes.add(e.target);
        pathEdgeKeys.add(`${e.source}→${e.target}`);
        walkDown(e.target);
      }
    });
  };

  // Walk upstream (source → source → ... → node)
  const walkUp = (current: string) => {
    edges.forEach((e) => {
      if (e.target === current && !pathNodes.has(e.source)) {
        pathNodes.add(e.source);
        pathEdgeKeys.add(`${e.source}→${e.target}`);
        walkUp(e.source);
      }
    });
  };

  pathNodes.add(nodeId);
  walkDown(nodeId);
  walkUp(nodeId);

  return pathNodes;
}

function getCausalEdgeKeys(nodeId: string, edges: GraphEdge[]): Set<string> {
  const keys = new Set<string>();
  const visited = new Set<string>();

  const walkDown = (current: string) => {
    if (visited.has(`d:${current}`)) return;
    visited.add(`d:${current}`);
    edges.forEach((e) => {
      if (e.source === current) {
        keys.add(`${e.source}→${e.target}`);
        walkDown(e.target);
      }
    });
  };
  const walkUp = (current: string) => {
    if (visited.has(`u:${current}`)) return;
    visited.add(`u:${current}`);
    edges.forEach((e) => {
      if (e.target === current) {
        keys.add(`${e.source}→${e.target}`);
        walkUp(e.source);
      }
    });
  };

  walkDown(nodeId);
  walkUp(nodeId);
  return keys;
}

/* ─── Component ─── */
export const BlastRadiusGraph: React.FC<Props> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    graph.nodes.find((n) => n.id === graph.center_node) || graph.nodes[0] || null
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const activeNodeId = hoveredNodeId;

  // Compute connected & causal-path sets for the hovered/focused node
  const { connectedIds, causalPathIds, causalEdgeKeys } = useMemo(() => {
    if (!activeNodeId) return { connectedIds: new Set<string>(), causalPathIds: new Set<string>(), causalEdgeKeys: new Set<string>() };
    return {
      connectedIds: getConnectedNodeIds(activeNodeId, graph.edges),
      causalPathIds: getCausalPath(activeNodeId, graph.edges),
      causalEdgeKeys: getCausalEdgeKeys(activeNodeId, graph.edges),
    };
  }, [activeNodeId, graph.edges]);

  // Find incoming & outgoing edges for selected node (inspector)
  const relevantEdges = selectedNode
    ? graph.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Determine node visual state
  const getNodeState = (nodeId: string): 'active' | 'connected' | 'causal' | 'dimmed' | 'default' => {
    if (!activeNodeId) return 'default';
    if (nodeId === activeNodeId) return 'active';
    if (connectedIds.has(nodeId)) return 'connected';
    if (causalPathIds.has(nodeId)) return 'causal';
    return 'dimmed';
  };

  // Determine edge visual state
  const getEdgeState = (edge: GraphEdge): 'active' | 'dimmed' | 'default' => {
    if (!activeNodeId) return 'default';
    const key = `${edge.source}→${edge.target}`;
    if (causalEdgeKeys.has(key)) return 'active';
    return 'dimmed';
  };

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
                const aws = resolveAwsService(node);
                const Icon = getNodeIcon(node.type, aws.key);
                const isSelected = selectedNode?.id === node.id;
                const isCenter = node.id === graph.center_node;
                const nodeState = getNodeState(node.id);
                const accentColor = aws.colors?.accent || '#58A6FF';

                // Dynamic styles based on hover/focus state
                let stateClasses = '';
                let stateStyles: React.CSSProperties = {};

                if (isSelected) {
                  stateClasses = 'bg-[#2F6FAD] border-[#58A6FF] text-[#FFFFFF] shadow-sm';
                } else {
                  switch (nodeState) {
                    case 'active':
                      stateStyles = {
                        borderColor: accentColor,
                        boxShadow: `0 0 12px ${accentColor}22, 0 0 4px ${accentColor}18`,
                        backgroundColor: aws.colors?.bg || 'rgba(88,166,255,0.10)',
                      };
                      stateClasses = 'text-[#FFFFFF]';
                      break;
                    case 'connected':
                      stateStyles = {
                        borderColor: `${accentColor}80`,
                        backgroundColor: aws.colors?.bg || '#1E1E22',
                      };
                      stateClasses = 'text-[#ECECEC]';
                      break;
                    case 'causal':
                      stateClasses = 'bg-[#1E1E22] border-[#3F3F46] text-[#ECECEC]';
                      break;
                    case 'dimmed':
                      stateClasses = 'bg-[#1E1E22] border-[#2A2A2F] text-[#71717A]';
                      stateStyles = { opacity: 0.45 };
                      break;
                    default:
                      stateClasses = 'bg-[#1E1E22] border-[#2A2A2F] text-[#ECECEC] hover:border-[#3F3F46]';
                      break;
                  }
                }

                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeSelect(node)}
                    onMouseEnter={() => handleNodeHover(node.id)}
                    onMouseLeave={() => handleNodeHover(null)}
                    onFocus={() => handleNodeHover(node.id)}
                    onBlur={() => handleNodeHover(null)}
                    className={`text-left p-3.5 rounded-[6px] border relative font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58A6FF] ${stateClasses}`}
                    style={{
                      ...stateStyles,
                      transition: prefersReducedMotion
                        ? 'none'
                        : 'all 180ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {/* Center Badge */}
                    {isCenter && (
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isSelected ? 'bg-[#FFFFFF] text-[#2F6FAD]' : 'bg-[#2F6FAD] text-[#FFFFFF]'
                      }`}>
                        Center
                      </span>
                    )}

                    {/* AWS Service Accent Stripe */}
                    {aws.colors && !isSelected && (
                      <div
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                        style={{ backgroundColor: aws.colors.accent, opacity: nodeState === 'dimmed' ? 0.3 : 0.7 }}
                      />
                    )}

                    {/* Type Label Row */}
                    <div className={`flex items-center gap-1.5 mb-1 pl-1.5 ${
                      isSelected ? 'text-[#D9E6F2]' : nodeState === 'dimmed' ? 'text-[#52525B]' : 'text-[#71717A]'
                    }`}>
                      <Icon className="w-3.5 h-3.5" style={!isSelected && aws.colors ? { color: aws.colors.accent } : undefined} />
                      <span className="text-[10px] uppercase tracking-wider font-semibold font-sans">
                        {getTypeLabel(node)}
                      </span>
                    </div>

                    {/* Resource Name */}
                    <div className={`font-semibold truncate text-[12px] pl-1.5 ${
                      isSelected ? 'text-[#FFFFFF]' : nodeState === 'dimmed' ? 'text-[#71717A]' : 'text-[#ECECEC]'
                    }`} title={node.label}>
                      {node.label}
                    </div>

                    {/* AWS Service Name */}
                    {aws.colors && (
                      <div className={`text-[10px] font-sans pl-1.5 mt-0.5 ${
                        isSelected ? 'text-[#D9E6F2]' : nodeState === 'dimmed' ? 'text-[#52525B]' : 'text-[#A1A1AA]'
                      }`}>
                        {aws.colors.label}
                      </div>
                    )}

                    {/* Severity Indicator */}
                    {node.severity != null && (
                      <div className={`mt-1.5 text-[10px] flex items-center gap-1 tabular pl-1.5 ${
                        isSelected ? 'text-[#FFFFFF]' : nodeState === 'dimmed' ? 'text-[#52525B]' : 'text-[#F85149]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#FFFFFF]' : nodeState === 'dimmed' ? 'bg-[#52525B]' : 'bg-[#F85149]'
                        }`} />
                        <span>SEV {node.severity.toFixed(2)}</span>
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
              Dependency Edges &amp; Corroborating Evidence
            </div>
            <div className="space-y-1.5">
              {graph.edges.map((edge, idx) => {
                const edgeState = getEdgeState(edge);
                const sourceNode = graph.nodes.find((n) => n.id === edge.source);
                const sourceAws = sourceNode ? resolveAwsService(sourceNode) : null;
                const edgeAccent = sourceAws?.colors?.accent || '#58A6FF';

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-[6px] border text-[12px] font-mono gap-1.5"
                    style={{
                      backgroundColor: edgeState === 'active' ? `${edgeAccent}08` : '#1E1E22',
                      borderColor: edgeState === 'active' ? `${edgeAccent}40` : '#2A2A2F',
                      opacity: edgeState === 'dimmed' ? 0.35 : 1,
                      transition: prefersReducedMotion ? 'none' : 'all 180ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold" style={{
                        color: edgeState === 'active' ? edgeAccent : '#58A6FF',
                      }}>
                        {edge.source}
                      </span>

                      {/* Directional arrow — animated pulse when edge is active */}
                      <span className="relative flex items-center">
                        <ArrowRight
                          className="w-3.5 h-3.5"
                          style={{
                            color: edgeState === 'active' ? edgeAccent : '#71717A',
                            transition: prefersReducedMotion ? 'none' : 'color 180ms',
                          }}
                        />
                        {edgeState === 'active' && !prefersReducedMotion && (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ animation: 'blast-edge-pulse 1.5s ease-in-out infinite' }}
                          >
                            <ArrowRight className="w-3.5 h-3.5" style={{ color: edgeAccent, opacity: 0.5 }} />
                          </span>
                        )}
                      </span>

                      <span className={edgeState === 'dimmed' ? 'text-[#71717A]' : 'text-[#ECECEC]'}>
                        {edge.target}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#121214] uppercase border" style={{
                        color: edgeState === 'active' ? edgeAccent : '#A1A1AA',
                        borderColor: edgeState === 'active' ? `${edgeAccent}30` : '#2A2A2F',
                      }}>
                        {edge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#71717A] truncate max-w-[300px]">
                      {edge.evidence.join(' · ')}
                    </div>
                  </div>
                );
              })}
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
            {selectedNode && (() => {
              const aws = resolveAwsService(selectedNode);
              return (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold"
                  style={{
                    color: aws.colors?.accent || '#58A6FF',
                    borderColor: aws.colors?.border || '#2A2A2F',
                    backgroundColor: aws.colors?.bg || '#1E1E22',
                  }}
                >
                  {selectedNode.type}
                </span>
              );
            })()}
          </div>

          {selectedNode ? (() => {
            const aws = resolveAwsService(selectedNode);
            return (
              <div className="space-y-4 text-[13px] font-sans">
                {/* Service Identity */}
                {aws.colors && (
                  <div className="flex items-center gap-2 p-2.5 rounded-[6px] border" style={{
                    backgroundColor: aws.colors.bg,
                    borderColor: aws.colors.border,
                  }}>
                    {(() => { const SvcIcon = getNodeIcon(selectedNode.type, aws.key); return <SvcIcon className="w-4 h-4" style={{ color: aws.colors!.accent }} />; })()}
                    <span className="text-[12px] font-mono font-semibold" style={{ color: aws.colors.accent }}>
                      {aws.colors.label}
                    </span>
                  </div>
                )}

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
                    {relevantEdges.map((e, idx) => {
                      const targetNode = graph.nodes.find((n) => n.id === (e.source === selectedNode.id ? e.target : e.source));
                      const targetAws = targetNode ? resolveAwsService(targetNode) : null;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-[6px] bg-[#1E1E22] border border-[#2A2A2F] text-[12px] space-y-1"
                        >
                          <div className="font-semibold flex items-center gap-1.5 font-mono" style={{
                            color: targetAws?.colors?.accent || '#58A6FF',
                          }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />
                            <span>{e.source === selectedNode.id ? `➔ ${e.target}` : `⬅ ${e.source}`}</span>
                          </div>
                          <div className="text-[11px] text-[#71717A]">
                            Rel: {e.label} (weight: {e.weight})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="py-8 text-center text-[13px] font-sans text-[#71717A]">
              Select a node in the graph to inspect metadata.
            </div>
          )}
        </div>
      </div>

      {/* Injected keyframe animation styles */}
      <style>{`
        @keyframes blast-edge-pulse {
          0%, 100% { transform: translateX(0); opacity: 0; }
          50% { transform: translateX(4px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
