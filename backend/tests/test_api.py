"""Integration tests for ChangeLens FastAPI endpoints."""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ChangeLens"
    assert "mode" in data


def test_stats_endpoint():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["active_investigations"] >= 1
    assert data["recent_changes"] >= 1
    assert data["evidence_count"] >= 1


def test_changes_endpoints():
    res = client.get("/api/changes")
    assert res.status_code == 200
    changes = res.json()
    assert len(changes) > 0

    first_id = changes[0]["id"]
    res_one = client.get(f"/api/changes/{first_id}")
    assert res_one.status_code == 200
    assert res_one.json()["id"] == first_id

    res_missing = client.get("/api/changes/non_existent_id")
    assert res_missing.status_code == 404


def test_investigations_endpoints():
    res = client.get("/api/investigations")
    assert res.status_code == 200
    invs = res.json()
    assert len(invs) > 0

    inv_id = invs[0]["id"]
    res_one = client.get(f"/api/investigations/{inv_id}")
    assert res_one.status_code == 200
    assert res_one.json()["id"] == inv_id

    # Timeline endpoint
    res_timeline = client.get(f"/api/investigations/{inv_id}/timeline")
    assert res_timeline.status_code == 200
    timeline = res_timeline.json()
    assert len(timeline) > 0
    # Verify multi-lane structure
    lanes = {e["lane"] for e in timeline}
    assert "CHANGE" in lanes
    assert "TELEMETRY" in lanes
    assert "HISTORICAL_MEMORY" in lanes

    # Graph endpoint
    res_graph = client.get(f"/api/investigations/{inv_id}/graph")
    assert res_graph.status_code == 200
    graph = res_graph.json()
    assert len(graph["nodes"]) > 0
    assert len(graph["edges"]) > 0

    # Evidence endpoint
    res_evidence = client.get(f"/api/investigations/{inv_id}/evidence")
    assert res_evidence.status_code == 200
    evs = res_evidence.json()
    assert len(evs) > 0
    assert evs[0]["hash"].startswith("sha256:")

    # Memory endpoint
    res_memory = client.get(f"/api/investigations/{inv_id}/memory")
    assert res_memory.status_code == 200
    mems = res_memory.json()
    assert len(mems) > 0

    # Narrative endpoint (public GET)
    res_narrative = client.get(f"/api/investigations/{inv_id}/narrative")
    assert res_narrative.status_code == 200
    narrative_data = res_narrative.json()
    assert "narrative" in narrative_data
    assert narrative_data["ai_narrative_provider"] in ("bedrock", "local_fallback")
    assert narrative_data["narrative"]["evidence_count"] >= 1

    # Evidence pack GET (public read-only)
    res_pack_get = client.get(f"/api/investigations/{inv_id}/evidence-pack")
    assert res_pack_get.status_code == 200
    pack_get = res_pack_get.json()
    assert pack_get["content_hash"].startswith("sha256:")

    # Evidence pack POST (export)
    res_pack = client.post(f"/api/investigations/{inv_id}/evidence-pack")
    assert res_pack.status_code == 200
    pack = res_pack.json()
    assert pack["content_hash"].startswith("sha256:")


def test_protected_mutating_endpoints_auth():
    """Verify protected mutating POST routes: no key, invalid key, valid key."""
    from app.config import settings

    action_payload = {
        "agent_id": "test-agent",
        "session_id": "sess-test",
        "capability": "scale_service",
        "requested_action": "UpdateFunctionConfiguration",
        "resource": "checkout-function",
        "approval_required": True,
        "approval_status": "missing",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    approval_payload = {
        "status": "approved",
        "approver": "ops-manager@example.com",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reason": "Emergency capacity restoration",
    }

    # 1. Fail closed when CHANGELENS_API_KEY is not configured
    original_key = settings.changelens_api_key
    try:
        settings.changelens_api_key = None
        # Should return 403 (fail closed)
        res = client.post("/api/events/agent-action", json=action_payload)
        assert res.status_code == 403
        assert "disabled" in res.json()["detail"].lower()

        res_demo = client.post("/api/demo/inject-change")
        assert res_demo.status_code == 403

        # 2. Configure a test API key
        settings.changelens_api_key = "test-auth-key-supersecret"

        # Case A: Protected POST with no key header -> denied (401 Unauthorized)
        res_no_header = client.post("/api/events/agent-action", json=action_payload)
        assert res_no_header.status_code == 401
        assert "missing" in res_no_header.json()["detail"].lower()

        res_demo_no_hdr = client.post("/api/demo/inject-change")
        assert res_demo_no_hdr.status_code == 401

        # Case B: Protected POST with incorrect key -> denied (403 Forbidden)
        res_bad_key = client.post(
            "/api/events/agent-action",
            json=action_payload,
            headers={"X-ChangeLens-Key": "wrong-key-value"},
        )
        assert res_bad_key.status_code == 403
        assert "invalid" in res_bad_key.json()["detail"].lower()

        res_bad_demo = client.post(
            "/api/demo/inject-change",
            headers={"X-ChangeLens-Key": "wrong-key-value"},
        )
        assert res_bad_demo.status_code == 403

        # Case C: Protected POST with correct key -> allowed (200 OK)
        valid_headers = {"X-ChangeLens-Key": "test-auth-key-supersecret"}

        res_ok_act = client.post(
            "/api/events/agent-action",
            json=action_payload,
            headers=valid_headers,
        )
        assert res_ok_act.status_code == 200
        assert res_ok_act.json()["agent_id"] == "test-agent"

        res_ok_apr = client.post(
            "/api/events/approval",
            json=approval_payload,
            headers=valid_headers,
        )
        assert res_ok_apr.status_code == 200
        assert res_ok_apr.json()["status"] == "approved"

        res_ok_demo = client.post(
            "/api/demo/inject-change",
            headers=valid_headers,
        )
        assert res_ok_demo.status_code == 200
        assert res_ok_demo.json()["id"] == "inv_demo_001"

    finally:
        settings.changelens_api_key = original_key


def test_cache_control_headers():
    """Verify strict anti-caching headers on dynamic API and health endpoints."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert "no-store" in res_health.headers.get("Cache-Control", "")
    assert res_health.headers.get("Pragma") == "no-cache"

    res_api = client.get("/api/investigations")
    assert res_api.status_code == 200
    assert "no-store" in res_api.headers.get("Cache-Control", "")
    assert res_api.headers.get("Pragma") == "no-cache"

