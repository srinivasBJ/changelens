"""Unit tests for ChangeLens core models."""

from datetime import datetime, timezone
import pytest
from app.models.core import (
    ActorType,
    AgentAction,
    Anomaly,
    Approval,
    ApprovalStatus,
    Change,
    ConfidenceLevel,
    EvidenceArtifact,
    EvidenceCategory,
    ImpactEdge,
    ImpactScore,
    OperationalMemory,
    TimelineEvent,
)


def test_change_model():
    """Verify Change model creation and defaults."""
    change = Change(
        timestamp=datetime.now(timezone.utc),
        service="lambda",
        action="UpdateFunctionConfiguration",
        resource_id="arn:aws:lambda:us-east-2:123456789012:function:checkout-function",
        resource_name="checkout-function",
        actor_type=ActorType.HUMAN,
        actor_id="user/ops-lead",
    )
    assert change.id.startswith("chg_")
    assert change.region == "us-east-2"
    assert change.source == "cloudtrail"


def test_agent_action_model():
    """Verify AgentAction event modeling and approval enforcement."""
    action = AgentAction(
        agent_id="agent-auto-scaler",
        session_id="session-001",
        capability="scale_service",
        requested_action="UpdateFunctionConfiguration",
        resource="checkout-function",
        timestamp=datetime.now(timezone.utc),
    )
    assert action.id.startswith("agt_")
    assert action.approval_required is True
    assert action.approval_status == ApprovalStatus.MISSING


def test_evidence_artifact_hash():
    """Verify SHA-256 hash generation for tamper evidence."""
    ev = EvidenceArtifact(
        case_id="inv_test_001",
        timestamp=datetime(2026, 10, 2, 14, 0, 0, tzinfo=timezone.utc),
        source="cloudtrail",
        category=EvidenceCategory.CHANGE,
        summary="Lambda reserved concurrency reduced to 1",
    )
    h1 = ev.compute_hash()
    assert h1.startswith("sha256:")
    assert len(h1) == 71  # "sha256:" (7) + 64 hex chars
    # Ensure idempotent hashing
    assert ev.compute_hash() == h1


def test_operational_memory_model():
    """Verify OperationalMemory schema matching Hindsight integration format."""
    mem = OperationalMemory(
        incident_type="lambda_throttling",
        affected_service="lambda",
        changed_resource="checkout-function",
        change_type="UpdateFunctionConfiguration",
        actor_type=ActorType.HUMAN,
        telemetry_signature="Lambda Throttles +300%",
        dependency_path=["checkout-function", "checkout-api"],
        impact_summary="Orders throttled",
        remediation="Restore reserved concurrency",
        evidence_summary="CloudTrail concurrency change",
        confidence=ConfidenceLevel.HIGH,
        outcome="Resolved",
        timestamp=datetime(2026, 9, 21, 12, 0, 0, tzinfo=timezone.utc),
        aws_service="lambda",
    )
    assert mem.id.startswith("mem_")
    assert mem.confidence == ConfidenceLevel.HIGH
