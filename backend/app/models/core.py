"""ChangeLens core data models.

All primary objects for the change-impact investigation system.
Uses Pydantic v2 with confidence-aware language throughout.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# --- Enums ---

class ActorType(str, Enum):
    HUMAN = "human"
    AUTOMATION = "automation"
    AI_AGENT = "ai_agent"
    SERVICE = "service"


class ApprovalStatus(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    MISSING = "missing"
    NOT_REQUIRED = "not_required"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class EvidenceCategory(str, Enum):
    CHANGE = "change"
    TELEMETRY = "telemetry"
    DEPENDENCY = "dependency"
    AGENT_ACTION = "agent_action"
    APPROVAL = "approval"
    BUSINESS_METRIC = "business_metric"
    HISTORICAL_MEMORY = "historical_memory"


# --- Primary Objects ---

class Change(BaseModel):
    """Represents an AWS infrastructure change detected via CloudTrail."""
    id: str = Field(default_factory=lambda: f"chg_{uuid.uuid4().hex[:12]}")
    timestamp: datetime
    service: str
    action: str
    resource_id: str
    resource_name: str
    actor_type: ActorType
    actor_id: str
    region: str = "us-east-2"
    source: str = "cloudtrail"
    raw_event_ref: Optional[str] = None
    account_id: Optional[str] = None
    is_live: bool = False


class Actor(BaseModel):
    """An entity that performed a change — human, automation, or AI agent."""
    id: str
    type: ActorType
    principal_arn: Optional[str] = None
    display_name: Optional[str] = None
    session_context: Optional[str] = None


class Approval(BaseModel):
    """Approval state associated with a change or agent action."""
    id: str = Field(default_factory=lambda: f"apr_{uuid.uuid4().hex[:12]}")
    change_id: Optional[str] = None
    agent_action_id: Optional[str] = None
    status: ApprovalStatus
    approver: Optional[str] = None
    timestamp: datetime
    reason: Optional[str] = None
    policy_ref: Optional[str] = None


class AgentAction(BaseModel):
    """A normalized agent action event for operational accountability."""
    id: str = Field(default_factory=lambda: f"agt_{uuid.uuid4().hex[:12]}")
    agent_id: str
    session_id: str
    capability: str
    requested_action: str
    resource: str
    approval_required: bool = True
    approval_status: ApprovalStatus = ApprovalStatus.MISSING
    timestamp: datetime
    outcome: Optional[str] = None
    change_id: Optional[str] = None


class Resource(BaseModel):
    """An AWS resource involved in an investigation."""
    id: str
    arn: Optional[str] = None
    name: str
    service: str
    resource_type: str
    region: str = "us-east-2"
    tags: dict = Field(default_factory=dict)


class Anomaly(BaseModel):
    """A detected telemetry anomaly from CloudWatch metrics."""
    id: str = Field(default_factory=lambda: f"anm_{uuid.uuid4().hex[:12]}")
    timestamp: datetime
    resource_id: str
    resource_name: str
    service: str
    metric_name: str
    metric_namespace: str
    baseline_value: float
    anomaly_value: float
    deviation_pct: float
    severity: float  # 0.0 to 1.0, normalized
    source: str = "cloudwatch"
    unit: Optional[str] = None


class BusinessMetric(BaseModel):
    """A business-level metric affected by an operational change."""
    id: str = Field(default_factory=lambda: f"biz_{uuid.uuid4().hex[:12]}")
    timestamp: datetime
    metric_name: str
    baseline_value: float
    current_value: float
    deviation_pct: float
    service: str
    source: str


class ImpactEdge(BaseModel):
    """A dependency relationship between resources/services."""
    source: str
    target: str
    relationship: str  # depends_on, invokes, reads_from, writes_to
    weight: float = 0.8
    evidence: List[str] = Field(default_factory=list)
    hop_distance: int = 1


class EvidenceArtifact(BaseModel):
    """A piece of evidence supporting an investigation hypothesis."""
    id: str = Field(default_factory=lambda: f"ev_{uuid.uuid4().hex[:12]}")
    case_id: str
    timestamp: datetime
    source: str  # cloudtrail, cloudwatch, dependency, memory, agent
    category: EvidenceCategory
    summary: str
    raw_reference: Optional[str] = None
    hash: Optional[str] = None  # sha256
    metadata: dict = Field(default_factory=dict)

    def compute_hash(self) -> str:
        """Compute SHA-256 hash of the evidence content."""
        content = json.dumps({
            "case_id": self.case_id,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "category": self.category.value,
            "summary": self.summary,
        }, sort_keys=True)
        self.hash = f"sha256:{hashlib.sha256(content.encode()).hexdigest()}"
        return self.hash


class ImpactScore(BaseModel):
    """Evidence-weighted impact score with transparent component breakdown."""
    overall: float
    metric_severity: float
    temporal_proximity: float
    dependency_weight: float
    actor_context: float
    historical_similarity: float
    confidence: ConfidenceLevel
    explanation: str


class OperationalMemory(BaseModel):
    """A historical incident memory stored/recalled via Hindsight."""
    id: str = Field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:12]}")
    incident_type: str
    affected_service: str
    changed_resource: str
    change_type: str
    actor_type: ActorType
    actor_id: Optional[str] = None  # sanitized — never store real credentials
    telemetry_signature: str
    dependency_path: List[str]
    impact_summary: str
    remediation: str
    evidence_summary: str
    confidence: ConfidenceLevel
    outcome: str
    timestamp: datetime
    aws_service: str
    region: str = "us-east-2"
    similarity_score: Optional[float] = None


class TimelineEvent(BaseModel):
    """An event on the investigation timeline."""
    timestamp: datetime
    lane: str  # CHANGE, TELEMETRY, AGENT, APPROVAL, BUSINESS_IMPACT, HISTORICAL_MEMORY
    title: str
    description: str
    source: str
    category: EvidenceCategory
    metadata: dict = Field(default_factory=dict)
    is_historical: bool = False


class InvestigationNarrative(BaseModel):
    """Evidence-grounded operational narrative generated by Bedrock LLM or local fallback."""
    summary: str
    observed_change: str
    telemetry_evidence: List[str]
    affected_resources: List[str]
    causal_assessment: str
    uncertainties: List[str]
    recommended_action: str
    evidence_count: int


class NarrativeResult(BaseModel):
    """Container for narrative content with transparent provider metadata."""
    narrative: InvestigationNarrative
    ai_narrative_provider: str  # "bedrock" or "local_fallback"
    status: str  # "BEDROCK_AVAILABLE", "BEDROCK_DISABLED", "BEDROCK_ERROR", "FALLBACK_USED"
    model_id: Optional[str] = None
    region: Optional[str] = None
    latency_ms: Optional[float] = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestigationCase(BaseModel):
    """A complete investigation case tying changes to impacts with evidence."""
    id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    title: str
    status: str = "active"  # active, resolved, dismissed
    created_at: datetime
    updated_at: Optional[datetime] = None
    trigger_change_id: str
    changes: List[Change] = Field(default_factory=list)
    anomalies: List[Anomaly] = Field(default_factory=list)
    business_metrics: List[BusinessMetric] = Field(default_factory=list)
    impact_edges: List[ImpactEdge] = Field(default_factory=list)
    evidence: List[EvidenceArtifact] = Field(default_factory=list)
    agent_actions: List[AgentAction] = Field(default_factory=list)
    approvals: List[Approval] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    impact_score: Optional[ImpactScore] = None
    historical_memories: List[OperationalMemory] = Field(default_factory=list)
    hypothesis: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)
    data_mode: str = "demo"  # "live" or "demo"
    operational_state: Optional[str] = "RESOLVED"  # ACTIVE, IMPACT_OBSERVED, INVESTIGATING, RESOLVED
    latest_telemetry_timestamp: Optional[datetime] = None
    current_window_anomalies_count: int = 0
    ai_narrative: Optional[NarrativeResult] = None
    ai_narrative_provider: Optional[str] = None


# --- Response Models ---

class DashboardStats(BaseModel):
    """Dashboard statistics summary."""
    active_investigations: int
    recent_changes: int
    impact_events: int
    historical_matches: int
    evidence_count: int
    agent_actions: int
    approval_exceptions: int


class GraphNode(BaseModel):
    """A node in the blast-radius graph."""
    id: str
    label: str
    type: str  # resource, service, operation, metric, change, agent
    metadata: dict = Field(default_factory=dict)
    severity: Optional[float] = None


class GraphEdge(BaseModel):
    """An edge in the blast-radius graph."""
    source: str
    target: str
    label: str
    evidence: List[str] = Field(default_factory=list)
    weight: float = 1.0


class BlastRadiusGraph(BaseModel):
    """The blast-radius dependency graph for an investigation."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    center_node: str


class EvidencePack(BaseModel):
    """A complete evidence pack generated for an investigation."""
    id: str = Field(default_factory=lambda: f"ep_{uuid.uuid4().hex[:12]}")
    investigation_id: str
    generated_at: datetime
    time_window_start: datetime
    time_window_end: datetime
    summary: str
    most_likely_change: Optional[Change] = None
    actor: Optional[Actor] = None
    approval_state: ApprovalStatus = ApprovalStatus.NOT_REQUIRED
    affected_resources: List[str] = Field(default_factory=list)
    dependency_path: List[str] = Field(default_factory=list)
    anomalies: List[Anomaly] = Field(default_factory=list)
    agent_actions: List[AgentAction] = Field(default_factory=list)
    historical_matches: List[OperationalMemory] = Field(default_factory=list)
    impact_score: Optional[ImpactScore] = None
    evidence_refs: List[EvidenceArtifact] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    content_hash: Optional[str] = None  # SHA-256 of the full pack
    s3_key: Optional[str] = None

    def compute_content_hash(self) -> str:
        """Compute SHA-256 hash of the evidence pack content."""
        content = self.model_dump_json(exclude={"content_hash", "s3_key"})
        self.content_hash = f"sha256:{hashlib.sha256(content.encode()).hexdigest()}"
        return self.content_hash


def extract_affected_resources(
    root_resource: Optional[str] = None,
    anomalies: Optional[List[Any]] = None,
    edges: Optional[List[Any]] = None,
) -> List[str]:
    """Return deduplicated list of AWS resource names involved in an incident.

    Excludes change event identifiers (e.g. starting with 'chg_') and preserves order.
    """
    seen = set()
    result = []

    def add(name: Optional[str]):
        if not name or name.startswith("chg_") or name in seen:
            return
        seen.add(name)
        result.append(name)

    add(root_resource)
    if anomalies:
        for a in anomalies:
            add(getattr(a, "resource_name", None))
    if edges:
        for e in edges:
            add(getattr(e, "source", None))
            add(getattr(e, "target", None))
    return result


def extract_dependency_path(
    root_resource: Optional[str] = None,
    edges: Optional[List[Any]] = None,
) -> List[str]:
    """Return clean resource-to-resource dependency path, excluding change events and duplicates."""
    if not edges:
        return [root_resource] if root_resource and not root_resource.startswith("chg_") else []

    resource_edges = [
        e for e in edges
        if not getattr(e, "source", "").startswith("chg_") and not getattr(e, "target", "").startswith("chg_")
    ]
    if not resource_edges:
        return [root_resource] if root_resource and not root_resource.startswith("chg_") else []

    path = []
    seen = set()
    if root_resource and not root_resource.startswith("chg_"):
        path.append(root_resource)
        seen.add(root_resource)

    for e in resource_edges:
        src = getattr(e, "source", "")
        tgt = getattr(e, "target", "")
        if src and src not in seen:
            seen.add(src)
            path.append(src)
        if tgt and tgt not in seen:
            seen.add(tgt)
            path.append(tgt)

    return path

