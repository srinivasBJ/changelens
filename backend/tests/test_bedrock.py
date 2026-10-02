"""Unit tests for BedrockService and narrative generation."""

import json
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError

import pytest
from app.models.core import (
    Anomaly,
    Change,
    ConfidenceLevel,
    EvidenceArtifact,
    EvidenceCategory,
    ImpactEdge,
    ImpactScore,
    InvestigationCase,
    InvestigationNarrative,
    NarrativeResult,
    OperationalMemory,
    ActorType,
)
from app.services.bedrock import (
    BedrockService,
    PROVIDER_BEDROCK,
    PROVIDER_FALLBACK,
    STATUS_BEDROCK_AVAILABLE,
    STATUS_BEDROCK_DISABLED,
    STATUS_FALLBACK_USED,
)


@pytest.fixture
def sample_investigation() -> InvestigationCase:
    chg = Change(
        id="chg_test_001",
        timestamp=datetime(2026, 10, 2, 11, 41, 31, tzinfo=timezone.utc),
        service="lambda",
        action="PutFunctionConcurrency",
        resource_id="arn:aws:lambda:us-east-2:979244568165:function:checkout-function",
        resource_name="checkout-function",
        actor_type=ActorType.HUMAN,
        actor_id="arn:aws:iam::979244568165:user/fproducion-aws",
        region="us-east-2",
        source="cloudtrail",
        is_live=True,
    )
    anm = Anomaly(
        id="anm_test_001",
        timestamp=datetime(2026, 10, 2, 11, 42, 0, tzinfo=timezone.utc),
        resource_id="checkout-function",
        resource_name="checkout-function",
        service="lambda",
        metric_name="Throttles",
        metric_namespace="AWS/Lambda",
        baseline_value=0.0,
        anomaly_value=32.0,
        deviation_pct=340.0,
        severity=0.85,
        source="cloudwatch",
    )
    edge = ImpactEdge(
        source="checkout-function",
        target="changelens-checkout-api",
        relationship="invoked_by",
        weight=0.9,
    )
    score = ImpactScore(
        overall=0.92,
        metric_severity=0.85,
        temporal_proximity=0.95,
        dependency_weight=0.90,
        actor_context=0.90,
        historical_similarity=0.88,
        confidence=ConfidenceLevel.HIGH,
        explanation="High temporal proximity (+29s) and direct dependency match",
    )
    ev = EvidenceArtifact(
        case_id="inv_test_001",
        timestamp=chg.timestamp,
        source="cloudtrail",
        category=EvidenceCategory.CHANGE,
        summary="PutFunctionConcurrency on checkout-function",
    )
    ev.compute_hash()

    return InvestigationCase(
        id="inv_test_001",
        title="Live Incident: checkout-function Impact Analysis",
        status="active",
        created_at=chg.timestamp,
        trigger_change_id=chg.id,
        changes=[chg],
        anomalies=[anm],
        impact_edges=[edge],
        evidence=[ev],
        impact_score=score,
        data_mode="live",
        operational_state="RESOLVED",
    )


def test_bedrock_adapter_input_construction(sample_investigation):
    """Verify that BedrockService extracts structured evidence without fabricating fields."""
    service = BedrockService(enabled=False)
    payload = service._extract_evidence_payload(sample_investigation)

    assert payload["investigation_id"] == "inv_test_001"
    assert payload["change"]["action"] == "PutFunctionConcurrency"
    assert payload["change"]["resource_name"] == "checkout-function"
    assert payload["change"]["actor_id"] == "arn:aws:iam::979244568165:user/fproducion-aws"
    assert len(payload["anomalies"]) == 1
    assert payload["anomalies"][0]["metric_name"] == "Throttles"
    assert payload["anomalies"][0]["deviation_pct"] == 340.0
    assert payload["impact_score"]["overall"] == 0.92
    assert "checkout-function" in payload["affected_resources"]
    assert "changelens-checkout-api" in payload["affected_resources"]

    # Verify prompt construction
    sys_prompt, user_prompt = service._build_prompt(payload)
    assert "STRICT RULES" in sys_prompt
    assert "NEVER invent AWS events" in sys_prompt
    assert "PutFunctionConcurrency" in user_prompt
    assert "0.92" in user_prompt


def test_bedrock_response_parsing(sample_investigation):
    """Verify that raw model output is correctly parsed and validated into InvestigationNarrative."""
    service = BedrockService(enabled=False)
    payload = service._extract_evidence_payload(sample_investigation)

    sample_llm_json = json.dumps({
        "summary": "Lambda concurrency reduction triggered throttling downstream.",
        "observed_change": "PutFunctionConcurrency on checkout-function by user at 11:41:31Z",
        "telemetry_evidence": [
            "Throttles on checkout-function: 32 (+340%) at 11:42:00Z",
            "Errors on checkout-function: 18 (+180%) at 11:42:00Z"
        ],
        "affected_resources": ["checkout-function", "changelens-checkout-api"],
        "causal_assessment": "Direct causality confirmed by +29s latency and invocation hierarchy.",
        "uncertainties": ["Current window telemetry is quiet; incident resolved."],
        "recommended_action": "Restore concurrency limit on checkout-function.",
        "evidence_count": 7
    })

    # Test with markdown fences
    fenced_output = f"```json\n{sample_llm_json}\n```"
    narrative = service._parse_bedrock_response(fenced_output, payload)

    assert isinstance(narrative, InvestigationNarrative)
    assert narrative.summary == "Lambda concurrency reduction triggered throttling downstream."
    assert "PutFunctionConcurrency" in narrative.observed_change
    assert len(narrative.telemetry_evidence) == 2
    assert narrative.evidence_count == 7
    assert len(narrative.uncertainties) == 1
    assert "Restore concurrency" in narrative.recommended_action


def test_bedrock_disabled_uses_fallback(sample_investigation):
    """When Bedrock is disabled via config, verify local fallback is used with explicit status."""
    service = BedrockService(enabled=False)
    result = service.generate_investigation_narrative(sample_investigation)

    assert isinstance(result, NarrativeResult)
    assert result.ai_narrative_provider == PROVIDER_FALLBACK
    assert result.status == STATUS_BEDROCK_DISABLED
    assert result.model_id is None
    assert result.narrative.evidence_count >= 1
    assert "checkout-function" in result.narrative.observed_change
    assert "0.92" in result.narrative.summary or "0.92" in result.narrative.causal_assessment


def test_bedrock_failure_reverts_to_fallback(sample_investigation):
    """When Bedrock client raises an error or times out, verify graceful fallback with FALLBACK_USED."""
    service = BedrockService(enabled=True)

    # Mock client to raise ClientError
    mock_client = MagicMock()
    mock_client.converse.side_effect = ClientError(
        {"Error": {"Code": "ModelTimeoutException", "Message": "Model timed out"}},
        "converse"
    )

    with patch.object(service, "_get_client", return_value=mock_client):
        result = service.generate_investigation_narrative(sample_investigation)

    assert isinstance(result, NarrativeResult)
    assert result.ai_narrative_provider == PROVIDER_FALLBACK
    assert result.status == STATUS_FALLBACK_USED
    assert result.narrative.evidence_count >= 1
    assert "checkout-function" in result.narrative.observed_change


def test_bedrock_success_path(sample_investigation):
    """When Bedrock client succeeds, verify BEDROCK_AVAILABLE and provider metadata."""
    service = BedrockService(enabled=True)

    valid_response = {
        "output": {
            "message": {
                "role": "assistant",
                "content": [
                    {
                        "text": json.dumps({
                            "summary": "Verified AWS incident: checkout-function throttling after PutFunctionConcurrency.",
                            "observed_change": "PutFunctionConcurrency by admin at 11:41:31Z.",
                            "telemetry_evidence": ["Throttles spiked +340% at 11:42:00Z."],
                            "affected_resources": ["checkout-function", "changelens-checkout-api"],
                            "causal_assessment": "High temporal correlation (+29s) confirms change impact.",
                            "uncertainties": ["Current window telemetry is quiet."],
                            "recommended_action": "Review concurrency quota.",
                            "evidence_count": 5
                        })
                    }
                ]
            }
        }
    }

    mock_client = MagicMock()
    mock_client.converse.return_value = valid_response

    with patch.object(service, "_get_client", return_value=mock_client):
        result = service.generate_investigation_narrative(sample_investigation)

    assert isinstance(result, NarrativeResult)
    assert result.ai_narrative_provider == PROVIDER_BEDROCK
    assert result.status == STATUS_BEDROCK_AVAILABLE
    assert result.model_id == service.model_id
    assert result.latency_ms is not None
    assert result.narrative.evidence_count == 5
    assert "Verified AWS incident" in result.narrative.summary


def test_score_remains_deterministic_after_narrative(sample_investigation):
    """Verify that generating an operational narrative DOES NOT alter the deterministic score."""
    original_score = sample_investigation.impact_score.overall
    original_confidence = sample_investigation.impact_score.confidence
    original_proximity = sample_investigation.impact_score.temporal_proximity

    service = BedrockService(enabled=False)
    result = service.generate_investigation_narrative(sample_investigation)

    # Narrative output contains summary and assessment
    assert result.narrative is not None

    # Deterministic investigation case properties remain completely unchanged
    assert sample_investigation.impact_score.overall == original_score
    assert sample_investigation.impact_score.confidence == original_confidence
    assert sample_investigation.impact_score.temporal_proximity == original_proximity
    assert sample_investigation.changes[0].timestamp.isoformat() == "2026-10-02T11:41:31+00:00"
    assert sample_investigation.anomalies[0].timestamp.isoformat() == "2026-10-02T11:42:00+00:00"
