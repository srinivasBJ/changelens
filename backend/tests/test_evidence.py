"""Unit tests for Evidence Artifacts and Evidence Pack generation."""

from datetime import datetime, timezone
import pytest
from app.models.core import (
    ApprovalStatus,
    Change,
    EvidenceArtifact,
    EvidenceCategory,
    EvidencePack,
)
from app.services.investigation import InvestigationService


@pytest.mark.asyncio
async def test_evidence_pack_generation():
    service = InvestigationService()
    pack = await service.generate_evidence_pack("inv_demo_001")
    assert pack is not None
    assert pack.investigation_id == "inv_demo_001"
    assert pack.content_hash is not None
    assert pack.content_hash.startswith("sha256:")
    assert len(pack.anomalies) > 0
    assert len(pack.historical_matches) > 0
    assert len(pack.evidence_refs) > 0
    assert pack.impact_score is not None
    assert pack.s3_key is not None
    assert "evidence-packs/inv_demo_001/" in pack.s3_key


def test_evidence_pack_hash_determinism():
    now = datetime(2026, 10, 2, 14, 0, 0, tzinfo=timezone.utc)
    pack1 = EvidencePack(
        id="ep_001",
        investigation_id="inv_001",
        generated_at=now,
        time_window_start=now,
        time_window_end=now,
        summary="Test evidence pack",
        approval_state=ApprovalStatus.APPROVED,
    )
    hash1 = pack1.compute_content_hash()

    pack2 = EvidencePack(
        id="ep_001",
        investigation_id="inv_001",
        generated_at=now,
        time_window_start=now,
        time_window_end=now,
        summary="Test evidence pack",
        approval_state=ApprovalStatus.APPROVED,
    )
    hash2 = pack2.compute_content_hash()
    assert hash1 == hash2
