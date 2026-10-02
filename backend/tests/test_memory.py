"""Unit tests for Operational Memory provider and Hindsight adapter."""

from datetime import datetime, timezone
import pytest
from app.adapters.memory import (
    FallbackMemoryProvider,
    _sanitize_memory,
    create_memory_provider,
)
from app.models.core import ActorType, ConfidenceLevel, OperationalMemory


@pytest.mark.asyncio
async def test_fallback_memory_provider():
    provider = FallbackMemoryProvider()
    assert len(provider.memories) >= 3

    # Recall based on Lambda throttling
    recalled = await provider.recall("lambda throttling concurrency", limit=3)
    assert len(recalled) > 0
    assert recalled[0].affected_service == "lambda"
    assert recalled[0].similarity_score is not None

    # Retain new memory
    new_mem = OperationalMemory(
        incident_type="dynamo_burst",
        affected_service="dynamodb",
        changed_resource="orders-table",
        change_type="UpdateTable",
        actor_type=ActorType.AUTOMATION,
        telemetry_signature="Throttles",
        dependency_path=["orders-table"],
        impact_summary="Delayed orders",
        remediation="Added GSI capacity",
        evidence_summary="CloudWatch metric",
        confidence=ConfidenceLevel.MEDIUM,
        outcome="Stabilized",
        timestamp=datetime.now(timezone.utc),
        aws_service="dynamodb",
    )
    mem_id = await provider.retain(new_mem)
    assert mem_id == new_mem.id
    assert any(m.id == new_mem.id for m in provider.memories)

    # Reflect across memories
    reflection = await provider.reflect(recalled)
    assert "Reflection across" in reflection
    assert "lambda" in reflection.lower()


def test_memory_sanitization():
    """Verify that AWS account IDs and credentials are sanitized before retention."""
    mem = OperationalMemory(
        incident_type="lambda_throttling",
        affected_service="lambda",
        changed_resource="arn:aws:lambda:us-east-2:123456789012:function:checkout",
        change_type="UpdateFunctionConfiguration",
        actor_type=ActorType.HUMAN,
        actor_id="arn:aws:iam::123456789012:user/admin",
        telemetry_signature="Throttles",
        dependency_path=["checkout"],
        impact_summary="Throttling",
        remediation="Reverted",
        evidence_summary="CloudTrail",
        confidence=ConfidenceLevel.HIGH,
        outcome="Resolved",
        timestamp=datetime.now(timezone.utc),
        aws_service="lambda",
    )
    sanitized = _sanitize_memory(mem)
    assert "123456789012" not in sanitized["actor_id"]
    assert "XXXXXXXXXXXX" in sanitized["actor_id"]
    assert "123456789012" not in sanitized["changed_resource"]
