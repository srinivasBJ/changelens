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

    # Evidence pack POST
    res_pack = client.post(f"/api/investigations/{inv_id}/evidence-pack")
    assert res_pack.status_code == 200
    pack = res_pack.json()
    assert pack["content_hash"].startswith("sha256:")


def test_events_and_demo_endpoints():
    # Agent action POST
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
    res_act = client.post("/api/events/agent-action", json=action_payload)
    assert res_act.status_code == 200
    assert res_act.json()["agent_id"] == "test-agent"

    # Approval POST
    approval_payload = {
        "status": "approved",
        "approver": "ops-manager@example.com",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reason": "Emergency capacity restoration",
    }
    res_apr = client.post("/api/events/approval", json=approval_payload)
    assert res_apr.status_code == 200
    assert res_apr.json()["status"] == "approved"

    # Demo inject POST
    res_demo = client.post("/api/demo/inject-change")
    assert res_demo.status_code == 200
    assert res_demo.json()["id"] == "inv_demo_001"
