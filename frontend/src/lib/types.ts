export type ActorType = 'human' | 'automation' | 'ai_agent' | 'service';
export type ApprovalStatus = 'approved' | 'rejected' | 'missing' | 'not_required';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';
export type EvidenceCategory = 
  | 'change' 
  | 'telemetry' 
  | 'dependency' 
  | 'agent_action' 
  | 'approval' 
  | 'business_metric' 
  | 'historical_memory';

export interface Change {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  resource_id: string;
  resource_name: string;
  actor_type: ActorType;
  actor_id: string;
  region: string;
  source: string;
  raw_event_ref?: string;
  account_id?: string;
  is_live?: boolean;
}

export interface Actor {
  id: string;
  type: ActorType;
  principal_arn?: string;
  display_name?: string;
}

export interface Approval {
  id: string;
  change_id?: string;
  agent_action_id?: string;
  status: ApprovalStatus;
  approver?: string;
  timestamp: string;
  reason?: string;
  policy_ref?: string;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  session_id: string;
  capability: string;
  requested_action: string;
  resource: string;
  approval_required: boolean;
  approval_status: ApprovalStatus;
  timestamp: string;
  outcome?: string;
  change_id?: string;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  resource_id: string;
  resource_name: string;
  service: string;
  metric_name: string;
  metric_namespace: string;
  baseline_value: number;
  anomaly_value: number;
  deviation_pct: number;
  severity: number;
  source: string;
  unit?: string;
}

export interface BusinessMetric {
  id: string;
  timestamp: string;
  metric_name: string;
  baseline_value: number;
  current_value: number;
  deviation_pct: number;
  service: string;
  source: string;
}

export interface ImpactEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  evidence: string[];
  hop_distance: number;
}

export interface EvidenceArtifact {
  id: string;
  case_id: string;
  timestamp: string;
  source: string;
  category: EvidenceCategory;
  summary: string;
  raw_reference?: string;
  hash: string;
  metadata?: Record<string, any>;
}

export interface ImpactScore {
  overall: number;
  metric_severity: number;
  temporal_proximity: number;
  dependency_weight: number;
  actor_context: number;
  historical_similarity: number;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface OperationalMemory {
  id: string;
  incident_type: string;
  affected_service: string;
  changed_resource: string;
  change_type: string;
  actor_type: ActorType;
  actor_id?: string;
  telemetry_signature: string;
  dependency_path: string[];
  impact_summary: string;
  remediation: string;
  evidence_summary: string;
  confidence: ConfidenceLevel;
  outcome: string;
  timestamp: string;
  aws_service: string;
  region: string;
  similarity_score?: number;
}

export interface TimelineEvent {
  timestamp: string;
  lane: 'CHANGE' | 'TELEMETRY' | 'AGENT' | 'APPROVAL' | 'BUSINESS_IMPACT' | 'HISTORICAL_MEMORY' | string;
  title: string;
  description: string;
  source: string;
  category: EvidenceCategory;
  metadata?: Record<string, any>;
  is_historical?: boolean;
}

export interface InvestigationNarrative {
  summary: string;
  observed_change: string;
  telemetry_evidence: string[];
  affected_resources: string[];
  causal_assessment: string;
  uncertainties: string[];
  recommended_action: string;
  evidence_count: number;
}

export interface NarrativeResult {
  narrative: InvestigationNarrative;
  ai_narrative_provider: 'bedrock' | 'local_fallback' | string;
  status: 'BEDROCK_AVAILABLE' | 'BEDROCK_DISABLED' | 'BEDROCK_ERROR' | 'FALLBACK_USED' | string;
  model_id?: string;
  region?: string;
  latency_ms?: number;
  generated_at: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string;
  trigger_change_id: string;
  changes: Change[];
  anomalies: Anomaly[];
  business_metrics: BusinessMetric[];
  impact_edges: ImpactEdge[];
  evidence: EvidenceArtifact[];
  agent_actions: AgentAction[];
  approvals: Approval[];
  timeline: TimelineEvent[];
  impact_score?: ImpactScore;
  historical_memories: OperationalMemory[];
  hypothesis?: string;
  recommended_actions: string[];
  data_mode: 'live' | 'demo';
  operational_state?: string;
  latest_telemetry_timestamp?: string;
  current_window_anomalies_count?: number;
  ai_narrative?: NarrativeResult;
  ai_narrative_provider?: string;
}

export interface DashboardStats {
  active_investigations: number;
  recent_changes: number;
  impact_events: number;
  historical_matches: number;
  evidence_count: number;
  agent_actions: number;
  approval_exceptions: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'change' | 'resource' | 'service' | 'operation' | 'metric' | 'agent';
  metadata?: Record<string, any>;
  severity?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  evidence: string[];
  weight: number;
}

export interface BlastRadiusGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_node: string;
}

export interface EvidencePack {
  id: string;
  investigation_id: string;
  generated_at: string;
  time_window_start: string;
  time_window_end: string;
  summary: string;
  most_likely_change?: Change;
  actor?: Actor;
  approval_state: ApprovalStatus;
  affected_resources: string[];
  dependency_path: string[];
  anomalies: Anomaly[];
  agent_actions: AgentAction[];
  historical_matches: OperationalMemory[];
  impact_score?: ImpactScore;
  evidence_refs: EvidenceArtifact[];
  recommended_actions: string[];
  content_hash?: string;
  s3_key?: string;
}
