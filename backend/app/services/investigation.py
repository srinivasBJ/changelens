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
from app.services.live_incident import (
    get_verified_live_change,
    get_verified_live_investigation,
)
import json
from pathlib import Path
from app.models.core import (
    AgentAction,
    Approval,
    ApprovalStatus,
    BlastRadiusGraph,
    Change,
    DashboardStats,
    EvidenceArtifact,
    EvidenceCategory,
    EvidencePack,
    GraphEdge,
    GraphNode,
    ImpactEdge,
    InvestigationCase,
    NarrativeResult,
    OperationalMemory,
    TimelineEvent,
)
from app.services.bedrock import BedrockService
from app.services.correlation import CorrelationEngine

logger = logging.getLogger(__name__)


class InvestigationService:
    """Core service managing the lifecycle of change-impact investigations."""

    def __init__(
        self,
        memory_provider: Optional[MemoryProvider] = None,
        aws_adapter: Optional[AWSAdapter] = None,
        correlation_engine: Optional[CorrelationEngine] = None,
        bedrock_service: Optional[BedrockService] = None,
    ):
        self.memory_provider = memory_provider or create_memory_provider(
            api_url=settings.hindsight_api_url if not settings.is_demo else None,
            api_key=settings.hindsight_api_key if not settings.is_demo else None,
            bank_id=settings.hindsight_bank_id,
        )
        self.aws_adapter = aws_adapter or AWSAdapter(region=settings.aws_region, profile=settings.aws_profile)
        self.correlation_engine = correlation_engine or CorrelationEngine()
        self.bedrock_service = bedrock_service or BedrockService()

        # In-memory storage for investigations, changes, approvals, agent actions
        self._investigations: Dict[str, InvestigationCase] = {}
        self._changes: Dict[str, Change] = {}
        self._agent_actions: Dict[str, AgentAction] = {}
        self._approvals: Dict[str, Approval] = {}
        self._last_live_sync: Optional[datetime] = None

        # Initialize with seeded demo data
        self._initialize_demo_state()

    def _get_live_store_path(self) -> Path:
        base_dir = Path(__file__).resolve().parent.parent / "data"
        base_dir.mkdir(parents=True, exist_ok=True)
        return base_dir / "live_incident_store.json"

    def _load_live_investigation(self) -> Optional[InvestigationCase]:
        try:
            store_path = self._get_live_store_path()
            if store_path.exists():
                with open(store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return InvestigationCase.model_validate(data)
        except Exception as e:
            logger.warning("Could not load persisted live incident: %s", e)
        return None

    def _save_live_investigation(self, inv: InvestigationCase):
        try:
            store_path = self._get_live_store_path()
            with open(store_path, "w", encoding="utf-8") as f:
                f.write(inv.model_dump_json(indent=2))
        except Exception as e:
            logger.warning("Could not save live incident to disk: %s", e)

    def _initialize_demo_state(self):
        """Populate initial state with seeded demo records and verified live incident."""
        demo_inv = get_demo_investigation()
        self._investigations[demo_inv.id] = demo_inv

        for chg in get_demo_changes():
            chg.is_live = False
            self._changes[chg.id] = chg

        for action in demo_inv.agent_actions:
            self._agent_actions[action.id] = action

        for apr in demo_inv.approvals:
            self._approvals[apr.id] = apr

        # Initialize verified live AWS incident so inv_live_001 is immediately ready
        live_inv = self._load_live_investigation() or get_verified_live_investigation()
        self._investigations[live_inv.id] = live_inv
        for chg in live_inv.changes:
            chg.is_live = True
            self._changes[chg.id] = chg
        verified_chg = get_verified_live_change()
        verified_chg.is_live = True
        self._changes[verified_chg.id] = verified_chg

    async def get_dashboard_stats(self) -> DashboardStats:
        """Calculate and return aggregated dashboard statistics."""
        if settings.is_demo:
            stats = get_demo_stats()
            return DashboardStats(
                active_investigations=sum(1 for i in self._investigations.values() if i.status in ("active", "resolved")),
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
        recent_changes = await self.aws_adapter.get_recent_cloudtrail_events(minutes=180)
        total_changes = len(self._changes)
        if recent_changes:
            total_changes = max(len(recent_changes), len(self._changes))
        return DashboardStats(
            active_investigations=sum(1 for i in self._investigations.values() if i.status in ("active", "resolved")),
            recent_changes=total_changes,
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
        verified_chg = get_verified_live_change()
        verified_chg.is_live = True
        self._changes[verified_chg.id] = verified_chg

        if settings.is_live and self.aws_adapter.is_available:
            live_changes = await self.aws_adapter.get_recent_cloudtrail_events(minutes=180)
            if live_changes:
                for chg in live_changes:
                    chg.is_live = True
                    self._changes[chg.id] = chg

        changes = list(self._changes.values())
        changes.sort(key=lambda x: x.timestamp, reverse=True)
        return changes

    async def get_change(self, change_id: str) -> Optional[Change]:
        """Get details for a specific change."""
        return self._changes.get(change_id)

    async def _sync_live_aws_data(self):
        """Query live CloudTrail and CloudWatch telemetry for checkout-function, checkout-table, and API Gateway."""
        if not (settings.is_live and self.aws_adapter.is_available):
            return

        now = datetime.now(timezone.utc)
        if self._last_live_sync and (now - self._last_live_sync).total_seconds() < 45:
            return
        self._last_live_sync = now

        try:
            # 1. Fetch real CloudTrail changes
            live_changes = await self.aws_adapter.get_recent_cloudtrail_events(minutes=180)
            for chg in live_changes:
                chg.is_live = True
                self._changes[chg.id] = chg

            verified_chg = get_verified_live_change()
            verified_chg.is_live = True
            self._changes[verified_chg.id] = verified_chg

            # 2. Fetch current CloudWatch anomalies (recent short window)
            lambda_anomalies = await self.aws_adapter.get_lambda_metrics(settings.demo_function_name, minutes=60)
            api_anomalies = await self.aws_adapter.get_api_gateway_metrics(settings.demo_api_name, minutes=60)
            ddb_anomalies = await self.aws_adapter.get_dynamodb_metrics(settings.demo_table_name, minutes=60)

            current_window_anomalies = lambda_anomalies + api_anomalies + ddb_anomalies

            # Retrieve verified base live investigation
            base_inv = self._investigations.get("inv_live_001") or get_verified_live_investigation()

            # Preserve all verified anomalies and append any fresh anomalies
            known_anomaly_keys = {(a.metric_name, a.timestamp.isoformat() if a.timestamp else "") for a in base_inv.anomalies}
            all_anomalies = list(base_inv.anomalies)

            for fresh in current_window_anomalies:
                key = (fresh.metric_name, fresh.timestamp.isoformat() if fresh.timestamp else "")
                if key not in known_anomaly_keys:
                    all_anomalies.append(fresh)
                    known_anomaly_keys.add(key)

            # Preserve all verified changes and append new changes
            known_change_ids = {c.id for c in base_inv.changes}
            all_changes = list(base_inv.changes)
            for fresh_chg in live_changes:
                if fresh_chg.id not in known_change_ids:
                    all_changes.append(fresh_chg)
                    known_change_ids.add(fresh_chg.id)

            # Lifecycle status & hypothesis determination
            if len(current_window_anomalies) > 0:
                op_state = "IMPACT_OBSERVED"
                status = "active"
                hypothesis = (
                    f"Active live incident: {len(current_window_anomalies)} telemetry anomalies detected "
                    f"in the current CloudWatch window across {settings.demo_function_name}. Correlated with infrastructure changes."
                )
            else:
                op_state = "RESOLVED"
                status = "resolved"
                score_val = base_inv.impact_score.overall if base_inv.impact_score else 0.92
                score_conf = base_inv.impact_score.confidence.value if base_inv.impact_score else "high"
                hypothesis = (
                    f"Verified live incident: Evidence-weighted impact score: {score_val:.2f} ({score_conf} confidence). "
                    "Peak throttling (+340%) and invocation errors (+180%) observed on checkout-function following PutFunctionConcurrency. "
                    f"Current AWS telemetry window is quiet (operational state: RESOLVED as of {now.strftime('%H:%M:%S UTC')})."
                )

            # Determine impact score
            impact_score = base_inv.impact_score
            if len(current_window_anomalies) > 0 and all_changes:
                calculated = self.correlation_engine.calculate_impact_score(
                    change=all_changes[0],
                    anomalies=all_anomalies,
                    edges=base_inv.impact_edges,
                    memories=base_inv.historical_memories,
                )
                if calculated:
                    impact_score = calculated

            # Update live investigation while strictly preserving verified evidence
            updated_live_inv = InvestigationCase(
                id="inv_live_001",
                title=f"Live Incident: {settings.demo_function_name} Impact Analysis",
                status=status,
                created_at=base_inv.created_at,
                updated_at=now,
                trigger_change_id=base_inv.trigger_change_id,
                changes=all_changes,
                anomalies=all_anomalies,
                business_metrics=base_inv.business_metrics,
                impact_edges=base_inv.impact_edges,
                evidence=base_inv.evidence,
                agent_actions=base_inv.agent_actions,
                approvals=base_inv.approvals,
                timeline=base_inv.timeline,
                impact_score=impact_score,
                historical_memories=base_inv.historical_memories,
                hypothesis=hypothesis,
                recommended_actions=base_inv.recommended_actions,
                data_mode="live",
                operational_state=op_state,
                latest_telemetry_timestamp=now,
                current_window_anomalies_count=len(current_window_anomalies),
                ai_narrative=base_inv.ai_narrative,
                ai_narrative_provider=base_inv.ai_narrative_provider,
            )

            self._investigations["inv_live_001"] = updated_live_inv
            self._save_live_investigation(updated_live_inv)

        except Exception as e:
            logger.error("Failed to sync live AWS data: %s", e)

    async def list_investigations(self) -> List[InvestigationCase]:
        """List all tracked investigations."""
        await self._sync_live_aws_data()
        invs = list(self._investigations.values())
        # Guarantee inv_live_001 is ALWAYS first (primary) in the list
        invs.sort(key=lambda x: (0 if x.id == "inv_live_001" else 1, -x.created_at.timestamp()))
        return invs

    async def get_investigation(self, investigation_id: str) -> Optional[InvestigationCase]:
        """Retrieve full details of an investigation."""
        await self._sync_live_aws_data()
        inv = self._investigations.get(investigation_id)
        if inv and inv.ai_narrative is None:
            await self.get_investigation_narrative(investigation_id)
        return inv

    async def get_investigation_narrative(
        self, investigation_id: str, force_refresh: bool = False
    ) -> Optional[NarrativeResult]:
        """Retrieve or generate Bedrock operational narrative with fallback."""
        inv = self._investigations.get(investigation_id)
        if not inv:
            return None

        # Return cached narrative if already generated and no force refresh requested
        if not force_refresh and inv.ai_narrative is not None:
            # If cached is fallback and Bedrock is now enabled, attempt upgrade
            if not (self.bedrock_service.enabled and inv.ai_narrative.ai_narrative_provider != "bedrock"):
                return inv.ai_narrative

        narrative_result = self.bedrock_service.generate_investigation_narrative(inv)
        inv.ai_narrative = narrative_result
        inv.ai_narrative_provider = narrative_result.ai_narrative_provider
        if inv.id == "inv_live_001":
            self._save_live_investigation(inv)
        return narrative_result

    async def get_timeline(self, investigation_id: str) -> List[TimelineEvent]:
        """Retrieve timeline events for an investigation."""
        inv = self._investigations.get(investigation_id)
        if not inv:
            return []
        timeline = list(inv.timeline)
        timeline.sort(key=lambda x: x.timestamp if x.timestamp.tzinfo else x.timestamp.replace(tzinfo=timezone.utc))
        return timeline

    async def get_graph(self, investigation_id: str) -> BlastRadiusGraph:
        """Generate or retrieve the blast-radius dependency graph."""
        inv = self._investigations.get(investigation_id)
        if inv and inv.id == "inv_demo_001":
            return get_demo_blast_radius_graph()

        # Dynamic graph generation from live investigation data
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        seen_nodes = set()

        center = settings.demo_function_name
        if inv:
            for chg in inv.changes:
                center = chg.resource_name
                if chg.id not in seen_nodes:
                    nodes.append(
                        GraphNode(
                            id=chg.id,
                            label=chg.action,
                            type="change",
                            metadata={"actor": chg.actor_id, "timestamp": chg.timestamp.isoformat()},
                        )
                    )
                    seen_nodes.add(chg.id)

                if chg.resource_name not in seen_nodes:
                    nodes.append(
                        GraphNode(
                            id=chg.resource_name,
                            label=chg.resource_name,
                            type="resource",
                            metadata={"service": chg.service},
                        )
                    )
                    seen_nodes.add(chg.resource_name)

                edges.append(
                    GraphEdge(
                        source=chg.id,
                        target=chg.resource_name,
                        label="modified",
                        evidence=["CloudTrail event"],
                        weight=1.0,
                    )
                )

            # Add topology impact edges
            for edge in inv.impact_edges:
                if edge.source not in seen_nodes:
                    nodes.append(GraphNode(id=edge.source, label=edge.source, type="resource"))
                    seen_nodes.add(edge.source)
                if edge.target not in seen_nodes:
                    nodes.append(GraphNode(id=edge.target, label=edge.target, type="service"))
                    seen_nodes.add(edge.target)
                edges.append(
                    GraphEdge(
                        source=edge.source,
                        target=edge.target,
                        label=edge.relationship,
                        evidence=edge.evidence,
                        weight=edge.weight,
                    )
                )

            # Add metric anomalies
            for anm in inv.anomalies:
                metric_node_id = f"metric_{anm.id}"
                if metric_node_id not in seen_nodes:
                    nodes.append(
                        GraphNode(
                            id=metric_node_id,
                            label=f"{anm.metric_name} ({anm.deviation_pct:+.0f}%)",
                            type="metric",
                            severity=anm.severity,
                        )
                    )
                    seen_nodes.add(metric_node_id)

                if anm.resource_name not in seen_nodes:
                    nodes.append(GraphNode(id=anm.resource_name, label=anm.resource_name, type="resource"))
                    seen_nodes.add(anm.resource_name)

                edges.append(
                    GraphEdge(
                        source=anm.resource_name,
                        target=metric_node_id,
                        label="telemetry",
                        evidence=["CloudWatch metric anomaly"],
                        weight=0.8,
                    )
                )

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
