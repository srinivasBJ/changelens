"""ChangeLens deterministic demo dataset.

Complete seeded scenario:
  API Gateway → Lambda checkout-function → DynamoDB
  Operator reduces Lambda reserved concurrency → throttling → errors → business impact

Every timestamp, ID, and metric is deterministic for reproducible demonstration.
This data is STRUCTURALLY IDENTICAL to live event data.

IMPORTANT: All data in this module is synthetic demo data.
           It must be clearly labeled as DEMO DATA in the UI.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.core import (
    ActorType,
    AgentAction,
    Anomaly,
    Approval,
    ApprovalStatus,
    BlastRadiusGraph,
    BusinessMetric,
    Change,
    ConfidenceLevel,
    DashboardStats,
    EvidenceArtifact,
    EvidenceCategory,
    GraphEdge,
    GraphNode,
    ImpactEdge,
    ImpactScore,
    InvestigationCase,
    OperationalMemory,
    TimelineEvent,
)


# --- Fixed timestamps for deterministic demo ---
T_BASE = datetime(2026, 10, 2, 14, 2, 0, tzinfo=timezone.utc)
T_CHANGE = datetime(2026, 10, 2, 14, 2, 11, tzinfo=timezone.utc)
T_THROTTLE = datetime(2026, 10, 2, 14, 2, 20, tzinfo=timezone.utc)
T_ERRORS = datetime(2026, 10, 2, 14, 2, 26, tzinfo=timezone.utc)
T_API_5XX = datetime(2026, 10, 2, 14, 2, 35, tzinfo=timezone.utc)
T_BUSINESS = datetime(2026, 10, 2, 14, 2, 40, tzinfo=timezone.utc)
T_MEMORY = datetime(2026, 10, 2, 14, 2, 50, tzinfo=timezone.utc)
T_AGENT = datetime(2026, 10, 2, 14, 1, 30, tzinfo=timezone.utc)


# --- Fixed IDs ---
CHANGE_ID = "chg_demo_001"
INV_ID = "inv_demo_001"
AGENT_ACTION_ID = "agt_demo_001"


def get_demo_changes():
    """Return deterministic demo changes."""
    return [
        Change(
            id=CHANGE_ID,
            timestamp=T_CHANGE,
            service="lambda",
            action="UpdateFunctionConfiguration",
            resource_id="arn:aws:lambda:us-east-2:XXXXXXXXXXXX:function:changelens-checkout-function",
            resource_name="checkout-function",
            actor_type=ActorType.HUMAN,
            actor_id="arn:aws:iam::XXXXXXXXXXXX:user/ops-engineer",
            region="us-east-2",
            source="cloudtrail",
            raw_event_ref="ct_event_demo_001",
            account_id="XXXXXXXXXXXX",
        ),
        Change(
            id="chg_demo_002",
            timestamp=datetime(2026, 10, 2, 13, 45, 0, tzinfo=timezone.utc),
            service="s3",
            action="PutBucketPolicy",
            resource_id="arn:aws:s3:::changelens-assets",
            resource_name="changelens-assets",
            actor_type=ActorType.AUTOMATION,
            actor_id="arn:aws:iam::XXXXXXXXXXXX:role/ci-deploy",
            region="us-east-2",
            source="cloudtrail",
            raw_event_ref="ct_event_demo_002",
        ),
        Change(
            id="chg_demo_003",
            timestamp=datetime(2026, 10, 2, 12, 30, 0, tzinfo=timezone.utc),
            service="dynamodb",
            action="TagResource",
            resource_id="arn:aws:dynamodb:us-east-2:XXXXXXXXXXXX:table/changelens-orders",
            resource_name="changelens-orders",
            actor_type=ActorType.HUMAN,
            actor_id="arn:aws:iam::XXXXXXXXXXXX:user/dev-engineer",
            region="us-east-2",
            source="cloudtrail",
            raw_event_ref="ct_event_demo_003",
        ),
    ]


def get_demo_anomalies():
    """Return deterministic demo anomalies."""
    return [
        Anomaly(
            id="anm_demo_001",
            timestamp=T_THROTTLE,
            resource_id="checkout-function",
            resource_name="checkout-function",
            service="lambda",
            metric_name="Throttles",
            metric_namespace="AWS/Lambda",
            baseline_value=2.0,
            anomaly_value=8.8,
            deviation_pct=340.0,
            severity=0.91,
            unit="Count",
        ),
        Anomaly(
            id="anm_demo_002",
            timestamp=T_ERRORS,
            resource_id="checkout-function",
            resource_name="checkout-function",
            service="lambda",
            metric_name="Errors",
            metric_namespace="AWS/Lambda",
            baseline_value=0.5,
            anomaly_value=1.4,
            deviation_pct=180.0,
            severity=0.72,
            unit="Count",
        ),
        Anomaly(
            id="anm_demo_003",
            timestamp=T_API_5XX,
            resource_id="checkout-api",
            resource_name="checkout-api",
            service="apigateway",
            metric_name="5XXError",
            metric_namespace="AWS/ApiGateway",
            baseline_value=1.1,
            anomaly_value=1.4,
            deviation_pct=27.0,
            severity=0.54,
            unit="Count",
        ),
    ]


def get_demo_business_metrics():
    """Return deterministic demo business metrics."""
    return [
        BusinessMetric(
            id="biz_demo_001",
            timestamp=T_BUSINESS,
            metric_name="OrdersCreated",
            baseline_value=142.0,
            current_value=116.4,
            deviation_pct=-18.0,
            service="checkout",
            source="application_metrics",
        ),
    ]


def get_demo_impact_edges():
    """Return the demo dependency graph edges."""
    return [
        ImpactEdge(
            source="checkout-function",
            target="checkout-api",
            relationship="invoked_by",
            weight=0.9,
            evidence=["API Gateway integration configuration"],
            hop_distance=1,
        ),
        ImpactEdge(
            source="checkout-api",
            target="POST /checkout",
            relationship="exposes",
            weight=0.8,
            evidence=["API Gateway route configuration"],
            hop_distance=1,
        ),
        ImpactEdge(
            source="POST /checkout",
            target="OrdersCreated",
            relationship="produces",
            weight=0.7,
            evidence=["Application business metric mapping"],
            hop_distance=1,
        ),
        ImpactEdge(
            source="checkout-function",
            target="changelens-orders",
            relationship="writes_to",
            weight=0.85,
            evidence=["Lambda environment variable TABLE_NAME"],
            hop_distance=1,
        ),
    ]


def get_demo_agent_action():
    """Return a demo agent action — AI agent requested scale_service with missing approval."""
    return AgentAction(
        id=AGENT_ACTION_ID,
        agent_id="cost-optimizer-agent-v2",
        session_id="sess_demo_001",
        capability="scale_service",
        requested_action="UpdateFunctionConfiguration",
        resource="checkout-function",
        approval_required=True,
        approval_status=ApprovalStatus.MISSING,
        timestamp=T_AGENT,
        outcome="Action not executed — approval missing",
        change_id=None,
    )


def get_demo_approval():
    """Return a demo approval object."""
    return Approval(
        id="apr_demo_001",
        change_id=None,
        agent_action_id=AGENT_ACTION_ID,
        status=ApprovalStatus.MISSING,
        approver=None,
        timestamp=T_AGENT,
        reason="AI agent requested configuration change without human approval",
        policy_ref="policy:require-approval-for-config-changes",
    )


def get_demo_historical_memories():
    """Return seeded historical operational memories."""
    return [
        OperationalMemory(
            id="mem_hist_001",
            incident_type="lambda_throttling",
            affected_service="lambda",
            changed_resource="checkout-function",
            change_type="UpdateFunctionConfiguration",
            actor_type=ActorType.HUMAN,
            actor_id="ops-engineer-A",
            telemetry_signature="Lambda Throttles +280%, API Gateway 5xx +22%",
            dependency_path=["checkout-function", "checkout-api", "OrdersCreated"],
            impact_summary="Checkout throughput reduced by 15% for 12 minutes",
            remediation="Reserved concurrency restored to 10. Runbook updated.",
            evidence_summary=(
                "CloudTrail: UpdateFunctionConfiguration (ReservedConcurrentExecutions: 2). "
                "CloudWatch: Throttles spike within 15 seconds. "
                "API Gateway: 5xx errors increased."
            ),
            confidence=ConfidenceLevel.HIGH,
            outcome="Configuration reverted. Incident resolved in 12 minutes.",
            timestamp=datetime(2026, 9, 21, 14, 30, 0, tzinfo=timezone.utc),
            aws_service="lambda",
            similarity_score=0.81,
        ),
        OperationalMemory(
            id="mem_hist_002",
            incident_type="lambda_timeout",
            affected_service="lambda",
            changed_resource="checkout-function",
            change_type="UpdateFunctionConfiguration",
            actor_type=ActorType.AI_AGENT,
            actor_id="cost-optimizer-agent",
            telemetry_signature="Lambda Duration p99 at timeout, Errors +200%",
            dependency_path=["checkout-function", "checkout-api", "OrdersCreated"],
            impact_summary="Checkout function timing out, orders failing",
            remediation="Timeout restored to 10s. Agent policy updated to require approval.",
            evidence_summary=(
                "CloudTrail: UpdateFunctionConfiguration (Timeout: 1s, was 10s). "
                "Agent: cost-optimizer-agent, capability: optimize_resources. "
                "Approval: missing."
            ),
            confidence=ConfidenceLevel.HIGH,
            outcome="Timeout restored. Agent now requires approval for config changes.",
            timestamp=datetime(2026, 9, 1, 11, 20, 0, tzinfo=timezone.utc),
            aws_service="lambda",
            similarity_score=0.73,
        ),
    ]


def _build_evidence_artifacts(case_id: str):
    """Build evidence artifacts with SHA-256 hashes."""
    artifacts = [
        EvidenceArtifact(
            id="ev_demo_001",
            case_id=case_id,
            timestamp=T_CHANGE,
            source="cloudtrail",
            category=EvidenceCategory.CHANGE,
            summary="CloudTrail: UpdateFunctionConfiguration on checkout-function — ReservedConcurrentExecutions changed to 1",
            raw_reference="ct_event_demo_001",
            metadata={"event_name": "UpdateFunctionConfiguration", "resource": "checkout-function"},
        ),
        EvidenceArtifact(
            id="ev_demo_002",
            case_id=case_id,
            timestamp=T_THROTTLE,
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            summary="CloudWatch: Lambda Throttles increased +340% (baseline: 2.0, current: 8.8)",
            raw_reference="cw_metric_throttles_demo",
            metadata={"metric": "Throttles", "deviation": "+340%"},
        ),
        EvidenceArtifact(
            id="ev_demo_003",
            case_id=case_id,
            timestamp=T_ERRORS,
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            summary="CloudWatch: Lambda Errors increased +180% (baseline: 0.5, current: 1.4)",
            raw_reference="cw_metric_errors_demo",
            metadata={"metric": "Errors", "deviation": "+180%"},
        ),
        EvidenceArtifact(
            id="ev_demo_004",
            case_id=case_id,
            timestamp=T_API_5XX,
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            summary="CloudWatch: API Gateway 5XXError increased +27% (baseline: 1.1, current: 1.4)",
            raw_reference="cw_metric_5xx_demo",
            metadata={"metric": "5XXError", "deviation": "+27%"},
        ),
        EvidenceArtifact(
            id="ev_demo_005",
            case_id=case_id,
            timestamp=T_CHANGE,
            source="dependency",
            category=EvidenceCategory.DEPENDENCY,
            summary="Dependency: checkout-function → checkout-api → POST /checkout → OrdersCreated (confirmed relationship)",
            raw_reference="dep_graph_demo",
            metadata={"path": ["checkout-function", "checkout-api", "POST /checkout", "OrdersCreated"]},
        ),
        EvidenceArtifact(
            id="ev_demo_006",
            case_id=case_id,
            timestamp=T_BUSINESS,
            source="application_metrics",
            category=EvidenceCategory.BUSINESS_METRIC,
            summary="Business metric: OrdersCreated decreased -18% (baseline: 142, current: 116.4)",
            raw_reference="biz_orders_demo",
            metadata={"metric": "OrdersCreated", "deviation": "-18%"},
        ),
        EvidenceArtifact(
            id="ev_demo_007",
            case_id=case_id,
            timestamp=T_AGENT,
            source="agent",
            category=EvidenceCategory.AGENT_ACTION,
            summary="AI Agent: cost-optimizer-agent-v2 requested scale_service on checkout-function — approval MISSING",
            raw_reference="agent_action_demo_001",
            metadata={"agent": "cost-optimizer-agent-v2", "capability": "scale_service", "approval": "missing"},
        ),
    ]

    # Compute hashes for all evidence
    for artifact in artifacts:
        artifact.compute_hash()

    return artifacts


def _build_timeline():
    """Build the multi-lane investigation timeline."""
    return [
        TimelineEvent(
            timestamp=T_AGENT,
            lane="AGENT",
            title="AI Agent Request",
            description="cost-optimizer-agent-v2 requested scale_service on checkout-function. Approval: MISSING.",
            source="agent",
            category=EvidenceCategory.AGENT_ACTION,
            metadata={"agent_id": "cost-optimizer-agent-v2", "approval": "missing"},
        ),
        TimelineEvent(
            timestamp=T_CHANGE,
            lane="CHANGE",
            title="UpdateFunctionConfiguration",
            description="Reserved concurrency for checkout-function changed to 1. Actor: ops-engineer (human).",
            source="cloudtrail",
            category=EvidenceCategory.CHANGE,
            metadata={"action": "UpdateFunctionConfiguration", "resource": "checkout-function"},
        ),
        TimelineEvent(
            timestamp=T_THROTTLE,
            lane="TELEMETRY",
            title="Lambda Throttles +340%",
            description="checkout-function throttle count increased from 2.0 to 8.8 (9 seconds after change).",
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            metadata={"metric": "Throttles", "deviation": "+340%"},
        ),
        TimelineEvent(
            timestamp=T_ERRORS,
            lane="TELEMETRY",
            title="Lambda Errors +180%",
            description="checkout-function errors increased from 0.5 to 1.4 (15 seconds after change).",
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            metadata={"metric": "Errors", "deviation": "+180%"},
        ),
        TimelineEvent(
            timestamp=T_API_5XX,
            lane="TELEMETRY",
            title="API Gateway 5xx +27%",
            description="checkout-api 5XXError rate increased (24 seconds after change).",
            source="cloudwatch",
            category=EvidenceCategory.TELEMETRY,
            metadata={"metric": "5XXError", "deviation": "+27%"},
        ),
        TimelineEvent(
            timestamp=T_BUSINESS,
            lane="BUSINESS_IMPACT",
            title="OrdersCreated -18%",
            description="Business metric OrdersCreated dropped from 142 to 116.4 orders.",
            source="application_metrics",
            category=EvidenceCategory.BUSINESS_METRIC,
            metadata={"metric": "OrdersCreated", "deviation": "-18%"},
        ),
        TimelineEvent(
            timestamp=T_MEMORY,
            lane="HISTORICAL_MEMORY",
            title="2 similar historical incidents found",
            description="Hindsight operational memory recalled 2 previous incidents with similar Lambda configuration change patterns. Highest similarity: 81%.",
            source="hindsight",
            category=EvidenceCategory.HISTORICAL_MEMORY,
            is_historical=True,
            metadata={"match_count": 2, "max_similarity": 0.81},
        ),
        TimelineEvent(
            timestamp=T_CHANGE,
            lane="APPROVAL",
            title="Approval: Missing",
            description="No approval record found for the configuration change. Agent action also missing approval.",
            source="governance",
            category=EvidenceCategory.APPROVAL,
            metadata={"status": "missing"},
        ),
    ]


def _build_impact_score():
    """Build the deterministic demo impact score."""
    return ImpactScore(
        overall=0.87,
        metric_severity=0.91,
        temporal_proximity=0.97,
        dependency_weight=1.0,
        actor_context=0.70,
        historical_similarity=0.76,
        confidence=ConfidenceLevel.HIGH,
        explanation=(
            "Evidence-weighted impact score: 0.87 (high confidence). "
            "Highest severity anomaly: Throttles on checkout-function (+340% deviation). "
            "2 similar historical incident(s) found, suggesting a high-confidence correlation with known patterns. "
            "The change 'UpdateFunctionConfiguration' on 'checkout-function' is the most likely contributing factor based on available evidence."
        ),
    )


def _build_blast_radius_graph():
    """Build the blast-radius graph for the demo investigation."""
    nodes = [
        GraphNode(id="change-1", label="UpdateFunctionConfiguration", type="change",
                  metadata={"action": "UpdateFunctionConfiguration", "actor": "ops-engineer"}, severity=0.91),
        GraphNode(id="checkout-function", label="checkout-function", type="resource",
                  metadata={"service": "lambda", "type": "Function"}, severity=0.91),
        GraphNode(id="checkout-api", label="checkout-api", type="service",
                  metadata={"service": "apigateway", "type": "RestApi"}, severity=0.54),
        GraphNode(id="post-checkout", label="POST /checkout", type="operation",
                  metadata={"method": "POST", "path": "/checkout"}),
        GraphNode(id="orders-created", label="OrdersCreated", type="metric",
                  metadata={"metric": "OrdersCreated", "deviation": "-18%"}, severity=0.36),
        GraphNode(id="orders-table", label="changelens-orders", type="resource",
                  metadata={"service": "dynamodb", "type": "Table"}),
        GraphNode(id="agent-1", label="cost-optimizer-agent-v2", type="agent",
                  metadata={"capability": "scale_service", "approval": "missing"}),
    ]

    edges = [
        GraphEdge(source="change-1", target="checkout-function", label="modified", evidence=["CloudTrail event"], weight=1.0),
        GraphEdge(source="checkout-function", target="checkout-api", label="invoked_by", evidence=["API GW integration"], weight=0.9),
        GraphEdge(source="checkout-api", target="post-checkout", label="exposes", evidence=["Route config"], weight=0.8),
        GraphEdge(source="post-checkout", target="orders-created", label="produces", evidence=["Business metric"], weight=0.7),
        GraphEdge(source="checkout-function", target="orders-table", label="writes_to", evidence=["Env var TABLE_NAME"], weight=0.85),
        GraphEdge(source="agent-1", target="checkout-function", label="requested_change", evidence=["Agent action log"], weight=0.6),
    ]

    return BlastRadiusGraph(nodes=nodes, edges=edges, center_node="checkout-function")


def get_demo_investigation() -> InvestigationCase:
    """Build the complete deterministic demo investigation case."""
    changes = get_demo_changes()
    anomalies = get_demo_anomalies()
    business_metrics = get_demo_business_metrics()
    edges = get_demo_impact_edges()
    agent_action = get_demo_agent_action()
    approval = get_demo_approval()
    memories = get_demo_historical_memories()
    evidence = _build_evidence_artifacts(INV_ID)
    timeline = _build_timeline()
    impact_score = _build_impact_score()

    return InvestigationCase(
        id=INV_ID,
        title="Likely Impact: checkout-function throttling after concurrency reduction",
        status="active",
        created_at=T_CHANGE,
        updated_at=T_MEMORY,
        trigger_change_id=CHANGE_ID,
        changes=[changes[0]],  # Only the trigger change
        anomalies=anomalies,
        business_metrics=business_metrics,
        impact_edges=edges,
        evidence=evidence,
        agent_actions=[agent_action],
        approvals=[approval],
        timeline=timeline,
        impact_score=impact_score,
        historical_memories=memories,
        hypothesis=(
            "High-confidence correlation: The UpdateFunctionConfiguration change on checkout-function "
            "(reducing reserved concurrency to 1) is the most likely cause of the observed throttling "
            "(+340%), error increase (+180%), and downstream API Gateway 5xx errors (+27%). "
            "This is an evidence-supported hypothesis, not a confirmed causal determination. "
            "2 similar historical incidents support this assessment with 81% pattern similarity."
        ),
        recommended_actions=[
            "Investigate: Verify current reserved concurrency setting for checkout-function",
            "Investigate: Review CloudTrail event details for the exact parameter change",
            "Consider: Restore reserved concurrency to previous value (likely 10)",
            "Review: AI agent cost-optimizer-agent-v2 attempted a similar action without approval",
            "Update: Add approval requirement for Lambda concurrency changes in operational runbook",
            "Document: Retain this investigation as operational memory for future reference",
        ],
        data_mode="demo",
    )


def get_demo_stats() -> DashboardStats:
    """Return deterministic dashboard statistics for demo mode."""
    return DashboardStats(
        active_investigations=1,
        recent_changes=12,
        impact_events=3,
        historical_matches=2,
        evidence_count=7,
        agent_actions=1,
        approval_exceptions=1,
    )


def get_demo_blast_radius_graph() -> BlastRadiusGraph:
    """Return the demo blast-radius graph."""
    return _build_blast_radius_graph()


def get_all_demo_data() -> dict:
    """Return all demo data as a dictionary."""
    return {
        "investigation": get_demo_investigation(),
        "changes": get_demo_changes(),
        "stats": get_demo_stats(),
        "graph": get_demo_blast_radius_graph(),
    }
