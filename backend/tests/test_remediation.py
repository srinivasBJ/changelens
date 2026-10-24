"""Unit tests for Actionable Remediation & Rollback Engine and AWS Console Deep-Links."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.investigation import InvestigationService, build_remediation_plan, build_console_links

client = TestClient(app)


@pytest.mark.asyncio
async def test_remediation_plan_live_incident():
    """Verify deterministic remediation runbook generation for live incident."""
    service = InvestigationService()
    inv = await service.get_investigation("inv_live_001")
    assert inv is not None
    assert inv.remediation_plan is not None

    plan = inv.remediation_plan
    assert plan.investigation_id == "inv_live_001"
    assert plan.target_resource == "checkout-function"
    assert plan.action_type == "concurrency_rollback"
    assert plan.risk_level == "LOW"
    assert "delete-function-concurrency" in plan.primary_command
    assert "get-function-concurrency" in plan.verification_command
    assert len(plan.steps) == 4
    assert len(plan.safety_checklist) >= 3
    assert len(plan.console_links) >= 4


def test_console_links_live_incident():
    """Verify AWS Console direct deep-links point to valid resources in us-east-2."""
    service = InvestigationService()
    inv = service._investigations["inv_live_001"]
    links = build_console_links(inv)

    assert len(links) >= 5
    services = {link.service for link in links}
    assert "cloudtrail" in services
    assert "cloudwatch" in services
    assert "lambda" in services
    assert "apigateway" in services
    assert "dynamodb" in services

    for link in links:
        assert link.url.startswith("https://us-east-2.console.aws.amazon.com/")
        assert link.title is not None
        assert link.description is not None


def test_remediation_api_endpoint():
    """Verify HTTP GET /api/investigations/{id}/remediation endpoint and anti-caching."""
    res = client.get("/api/investigations/inv_live_001/remediation")
    assert res.status_code == 200
    assert "no-store" in res.headers.get("Cache-Control", "")

    data = res.json()
    assert data["investigation_id"] == "inv_live_001"
    assert data["target_resource"] == "checkout-function"
    assert "delete-function-concurrency" in data["primary_command"]
    assert len(data["steps"]) == 4
    assert len(data["console_links"]) >= 4

    # Test 404 for non-existent investigation
    res_404 = client.get("/api/investigations/inv_non_existent/remediation")
    assert res_404.status_code == 404
