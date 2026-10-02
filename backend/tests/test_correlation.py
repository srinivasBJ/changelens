"""Unit tests for the explainable CorrelationEngine."""

from datetime import datetime, timezone, timedelta
import pytest
from app.models.core import (
    ActorType,
    AgentAction,
    Anomaly,
    Approval,
    ApprovalStatus,
    Change,
    ConfidenceLevel,
    ImpactEdge,
    OperationalMemory,
)
from app.services.correlation import CorrelationEngine


@pytest.fixture
def engine():
    return CorrelationEngine()


@pytest.fixture
def sample_change():
    return Change(
        id="chg_001",
        timestamp=datetime(2026, 10, 2, 14, 0, 0, tzinfo=timezone.utc),
        service="lambda",
        action="UpdateFunctionConfiguration",
        resource_id="arn:aws:lambda:us-east-2:123456789012:function:checkout-function",
        resource_name="checkout-function",
        actor_type=ActorType.HUMAN,
        actor_id="user/ops-lead",
    )


@pytest.fixture
def sample_anomalies(sample_change):
    return [
        Anomaly(
            timestamp=sample_change.timestamp + timedelta(seconds=10),
            resource_id="checkout-function",
            resource_name="checkout-function",
            service="lambda",
            metric_name="Throttles",
            metric_namespace="AWS/Lambda",
            baseline_value=1.0,
            anomaly_value=9.0,
            deviation_pct=340.0,
            severity=0.9,
        ),
        Anomaly(
            timestamp=sample_change.timestamp + timedelta(seconds=25),
            resource_id="checkout-api",
            resource_name="checkout-api",
            service="apigateway",
            metric_name="5XXError",
            metric_namespace="AWS/ApiGateway",
            baseline_value=0.2,
            anomaly_value=1.0,
            deviation_pct=50.0,
            severity=0.6,
        ),
    ]


@pytest.fixture
def sample_edges():
    return [
        ImpactEdge(source="checkout-function", target="checkout-api", relationship="invoked_by", weight=0.9),
        ImpactEdge(source="checkout-api", target="POST /checkout", relationship="exposes", weight=0.8),
        ImpactEdge(source="POST /checkout", target="OrdersCreated", relationship="produces", weight=0.7),
    ]


@pytest.fixture
def sample_memories():
    return [
        OperationalMemory(
            id="mem_001",
            incident_type="lambda_throttling",
            affected_service="lambda",
            changed_resource="checkout-function",
            change_type="UpdateFunctionConfiguration",
            actor_type=ActorType.HUMAN,
            telemetry_signature="Lambda Throttles +280%",
            dependency_path=["checkout-function", "checkout-api"],
            impact_summary="Orders throttled",
            remediation="Restored concurrency",
            evidence_summary="CloudTrail concurrency change",
            confidence=ConfidenceLevel.HIGH,
            outcome="Resolved",
            timestamp=datetime(2026, 9, 21, 12, 0, 0, tzinfo=timezone.utc),
            aws_service="lambda",
            similarity_score=0.8,
        )
    ]


def test_metric_severity_calculation(engine, sample_anomalies):
    severity = engine._calculate_metric_severity(sample_anomalies)
    assert severity == 0.9


def test_temporal_proximity_calculation(engine, sample_change, sample_anomalies):
    # Anomalies at T+10s and T+25s -> min delta is 10s
    # Max window is 300s -> 1 - (10/300) = 0.97
    score = engine._calculate_temporal_proximity(sample_change.timestamp, sample_anomalies)
    assert score >= 0.95


def test_dependency_weight_same_resource(engine, sample_anomalies, sample_edges):
    # checkout-function anomaly is on the same resource
    weight = engine._calculate_dependency_weight("checkout-function", sample_anomalies, sample_edges)
    assert weight == 1.0


def test_dependency_weight_direct_dep(engine, sample_edges):
    anomaly = [
        Anomaly(
            timestamp=datetime.now(timezone.utc),
            resource_id="checkout-api",
            resource_name="checkout-api",
            service="apigateway",
            metric_name="5XXError",
            metric_namespace="AWS/ApiGateway",
            baseline_value=0.0,
            anomaly_value=1.0,
            deviation_pct=50.0,
            severity=0.5,
        )
    ]
    weight = engine._calculate_dependency_weight("checkout-function", anomaly, sample_edges)
    assert weight == 0.8  # 1-hop direct dependency


def test_dependency_path_bfs(engine, sample_edges):
    path = engine.find_dependency_path("checkout-function", "OrdersCreated", sample_edges)
    assert path == ["checkout-function", "checkout-api", "POST /checkout", "OrdersCreated"]


def test_overall_impact_score(engine, sample_change, sample_anomalies, sample_edges, sample_memories):
    score = engine.calculate_impact_score(
        change=sample_change,
        anomalies=sample_anomalies,
        edges=sample_edges,
        memories=sample_memories,
    )
    assert score.overall > 0.75
    assert score.confidence == ConfidenceLevel.HIGH
    assert "Evidence-weighted impact score" in score.explanation
    # Verify confidence-aware language
    assert "most likely" in score.explanation.lower()
    assert "definitely caused" not in score.explanation.lower()
