"""Investigation service for ChangeLens.

Coordinates changes, anomalies, evidence aggregation, correlation scoring,
operational memory matching (via Hindsight/fallback), and evidence pack generation.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.adapters.aws_adapter import AWSAdapter
from app.adapters.memory import MemoryProvider, create_memory_provider
from app.config import settings
from app.demo.seed_data import (
    get_all_demo_data,
    get_demo_changes,
    get_demo_investigation,
    get_demo_stats,
    get_demo_blast_radius_graph,
)
from app.models.core import (
    AgentAction,
    Approval,
    ApprovalStatus,
    BlastRadiusGraph,
    Change,
    DashboardStats,
    EvidenceArtifact,
    EvidencePack,
    InvestigationCase,
    OperationalMemory,
    TimelineEvent,
)
from app.services.correlation import CorrelationEngine

logger = logging.getLogger(__name__)


class InvestigationService:
    """Core service managing the lifecycle of change-impact investigations."""

    def __init__(
        self,
        memory_provider: Optional[MemoryProvider] = None,
        aws_adapter: Optional[AWSAdapter] = None,
        correlation_engine: Optional[CorrelationEngine] = None,
    ):
        self.memory_provider = memory_provider or create_memory_provider(
            api_url=settings.hindsight_api_url if not settings.is_demo else None,
            api_key=settings.hindsight_api_key if not settings.is_demo else None,
            bank_id=settings.hindsight_bank_id,
        )
        self.aws_adapter = aws_adapter or AWSAdapter(region=settings.aws_region, profile=settings.aws_profile)
        self.correlation_engine = correlation_engine or CorrelationEngine()

        # In-memory storage for investigations, changes, approvals, agent actions
        self._investigations: Dict[str, InvestigationCase] = {}
        self._changes: Dict[str, Change] = {}
        self._agent_actions: Dict[str, AgentAction] = {}
        self._approvals: Dict[str, Approval] = {}

        # Initialize with seeded demo data
        self._initialize_demo_state()

    def _initialize_demo_state(self):
        """Populate initial state with seeded demo records."""
        demo_inv = get_demo_investigation()
        self._investigations[demo_inv.id] = demo_inv

        for chg in get_demo_changes():
            self._changes[chg.id] = chg

        for action in demo_inv.agent_actions:
            self._agent_actions[action.id] = action

        for apr in demo_inv.approvals:
            self._approvals[apr.id] = apr

    async def get_dashboard_stats(self) -> DashboardStats:
        """Calculate and return aggregated dashboard statistics."""
        if settings.is_demo:
            stats = get_demo_stats()
            # Adjust dynamically based on current state
            return DashboardStats(
                active_investigations=sum(1 for i in self._investigations.values() if i.status == "active"),
                recent_changes=len(self._changes),
                impact_events=sum(len(i.anomalies) for i in self._investigations.values()),
                historical_matches=sum(len(i.historical_memories) for i in self._investigations.values()),
                evidence_count=sum(len(i.evidence) for i in self._investigations.values()),
                agent_actions=len(self._agent_actions),
                approval_exceptions=sum(
                    1 for a in self._approvals.values() if a.status in (ApprovalStatus.MISSING, ApprovalStatus.REJECTED)
                ),
            )

        # In LIVE mode, query real telemetry
        recent_changes = await self.aws_adapter.get_recent_cloudtrail_events(minutes=120)
        return DashboardStats(
            active_investigations=sum(1 for i in self._investigations.values() if i.status == "active"),
            recent_changes=len(recent_changes),
            impact_events=sum(len(i.anomalies) for i in self._investigations.values()),
            historical_matches=sum(len(i.historical_memories) for i in self._investigations.values()),
            evidence_count=sum(len(i.evidence) for i in self._investigations.values()),
            agent_actions=len(self._agent_actions),
            approval_exceptions=sum(
                1 for a in self._approvals.values() if a.status in (ApprovalStatus.MISSING, ApprovalStatus.REJECTED)
            ),
        )

    async def list_changes(self) -> List[Change]:
        """List recent changes detected in CloudTrail or demo state."""
        if settings.is_live and self.aws_adapter.is_available:
            live_changes = await self.aws_adapter.get_recent_cloudtrail_events(minutes=120)
            if live_changes:
                for chg in live_changes:
                    self._changes[chg.id] = chg
                return live_changes

        # Fallback or demo mode: return sorted by timestamp descending
        changes = list(self._changes.values())
        changes.sort(key=lambda x: x.timestamp, reverse=True)
        return changes

    async def get_change(self, change_id: str) -> Optional[Change]:
        """Get details for a specific change."""
        return self._changes.get(change_id)

    async def list_investigations(self) -> List[InvestigationCase]:
        """List all tracked investigations."""
        invs = list(self._investigations.values())
        invs.sort(key=lambda x: x.created_at, reverse=True)
        return invs

    async def get_investigation(self, investigation_id: str) -> Optional[InvestigationCase]:
        """Retrieve full details of an investigation."""
        return self._investigations.get(investigation_id)

    async def get_timeline(self, investigation_id: str) -> List[TimelineEvent]:
        """Retrieve timeline events for an investigation."""
        inv = self._investigations.get(investigation_id)
        if not inv:
            return []
        timeline = list(inv.timeline)
        timeline.sort(key=lambda x: x.timestamp)
        return timeline

    async def get_graph(self, investigation_id: str) -> BlastRadiusGraph:
        """Generate or retrieve the blast-radius dependency graph."""
        inv = self._investigations.get(investigation_id)
        if inv and inv.id == "inv_demo_001":
            return get_demo_blast_radius_graph()

        # Dynamic graph generation if another investigation exists
        nodes = []
        edges = []
        center = "unknown"
        if inv:
            for chg in inv.changes:
                center = chg.resource_name
                nodes.append({"id": chg.id, "label": chg.action, "type": "change", "metadata": {"actor": chg.actor_id}})
                nodes.append({"id": chg.resource_name, "label": chg.resource_name, "type": "resource", "metadata": {"service": chg.service}})
                edges.append({"source": chg.id, "target": chg.resource_name, "label": "modified", "evidence": ["CloudTrail event"], "weight": 1.0})

            for anm in inv.anomalies:
                nodes.append({"id": f"metric_{anm.id}", "label": f"{anm.metric_name} ({anm.deviation_pct:+.0f}%)", "type": "metric", "severity": anm.severity})
                edges.append({"source": anm.resource_name, "target": f"metric_{anm.id}", "label": "telemetry", "evidence": ["CloudWatch metric"], "weight": 0.8})

        return BlastRadiusGraph(nodes=nodes, edges=edges, center_node=center)

    async def get_evidence(self, investigation_id: str) -> List[EvidenceArtifact]:
        """Retrieve all verified evidence artifacts for an investigation."""
        inv = self._investigations.get(investigation_id)
        return inv.evidence if inv else []

    async def get_memories(self, investigation_id: str) -> List[OperationalMemory]:
        """Retrieve operational memories recalled for an investigation."""
        inv = self._investigations.get(investigation_id)
        if inv and inv.historical_memories:
            return inv.historical_memories

        # Attempt to recall from the memory provider
        if inv:
            query = f"{inv.title} {inv.trigger_change_id}"
            return await self.memory_provider.recall(query=query, limit=5)
        return []

    async def generate_evidence_pack(self, investigation_id: str) -> Optional[EvidencePack]:
        """Generate a complete, tamper-evident Evidence Pack with SHA-256 content hash."""
        inv = self._investigations.get(investigation_id)
        if not inv:
            return None

        now = datetime.now(timezone.utc)
        most_likely_change = inv.changes[0] if inv.changes else None

        # Determine actor
        actor = None
        if most_likely_change:
            from app.models.core import Actor
            actor = Actor(
                id=most_likely_change.actor_id,
                type=most_likely_change.actor_type,
                principal_arn=most_likely_change.actor_id,
                display_name=most_likely_change.actor_id.split("/")[-1] if "/" in most_likely_change.actor_id else most_likely_change.actor_id,
            )

        # Build pack
        pack = EvidencePack(
            investigation_id=inv.id,
            generated_at=now,
            time_window_start=inv.created_at,
            time_window_end=inv.updated_at or now,
            summary=(
                f"Evidence Pack for {inv.title}. "
                f"Evaluated {len(inv.changes)} changes, {len(inv.anomalies)} anomalies, "
                f"and {len(inv.historical_memories)} historical operational memories."
            ),
            most_likely_change=most_likely_change,
            actor=actor,
            approval_state=inv.approvals[0].status if inv.approvals else ApprovalStatus.NOT_REQUIRED,
            affected_resources=[a.resource_name for a in inv.anomalies] or [most_likely_change.resource_name] if most_likely_change else [],
            dependency_path=[e.source for e in inv.impact_edges] + [inv.impact_edges[-1].target] if inv.impact_edges else [],
            anomalies=inv.anomalies,
            agent_actions=inv.agent_actions,
            historical_matches=inv.historical_memories,
            impact_score=inv.impact_score,
            evidence_refs=inv.evidence,
            recommended_actions=inv.recommended_actions,
            s3_key=f"evidence-packs/{inv.id}/{now.strftime('%Y%m%d_%H%M%S')}.json",
        )

        # Compute SHA-256 hash
        pack.compute_content_hash()
        logger.info("Generated evidence pack %s with hash %s", pack.id, pack.content_hash)
        return pack

    async def record_agent_action(self, action: AgentAction) -> AgentAction:
        """Record an autonomous AI agent action for operational accountability."""
        self._agent_actions[action.id] = action

        # If it affects an active investigation, link it
        for inv in self._investigations.values():
            if any(chg.resource_name == action.resource for chg in inv.changes):
                inv.agent_actions.append(action)
                inv.timeline.append(
                    TimelineEvent(
                        timestamp=action.timestamp,
                        lane="AGENT",
                        title=f"AI Agent: {action.capability}",
                        description=f"Agent {action.agent_id} requested {action.requested_action} on {action.resource}. Approval: {action.approval_status.value}.",
                        source="agent",
                        category="agent_action",
                        metadata={"agent_id": action.agent_id, "capability": action.capability},
                    )
                )
        return action

    async def record_approval(self, approval: Approval) -> Approval:
        """Record an approval or rejection event."""
        self._approvals[approval.id] = approval
        for inv in self._investigations.values():
            inv.approvals.append(approval)
        return approval

    async def inject_demo_change(self) -> InvestigationCase:
        """Inject the demo change scenario and return the resulting investigation."""
        demo_inv = get_demo_investigation()
        # Reset to deterministic state
        self._investigations[demo_inv.id] = demo_inv
        return demo_inv
