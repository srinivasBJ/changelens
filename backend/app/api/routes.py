"""FastAPI routes for ChangeLens API.

Provides operational intelligence endpoints for changes, investigations,
timelines, blast-radius dependency graphs, evidence artifacts, and operational memories.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_investigation_service
from app.config import settings
from app.models.core import (
    AgentAction,
    Approval,
    BlastRadiusGraph,
    Change,
    DashboardStats,
    EvidenceArtifact,
    EvidencePack,
    InvestigationCase,
    OperationalMemory,
    TimelineEvent,
)
from app.services.investigation import InvestigationService

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint indicating service status and active mode."""
    return {
        "status": "healthy",
        "service": "ChangeLens",
        "mode": settings.changelens_mode,
        "region": settings.aws_region,
        "hindsight_bank": settings.hindsight_bank_id,
    }


@router.get("/api/stats", response_model=DashboardStats, tags=["Dashboard"])
async def get_stats(
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve operational dashboard statistics."""
    return await service.get_dashboard_stats()


@router.get("/api/changes", response_model=List[Change], tags=["Changes"])
async def list_changes(
    service: InvestigationService = Depends(get_investigation_service),
):
    """List recent infrastructure changes detected across the AWS account."""
    return await service.list_changes()


@router.get("/api/changes/{change_id}", response_model=Change, tags=["Changes"])
async def get_change(
    change_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve details for a specific CloudTrail change event."""
    change = await service.get_change(change_id)
    if not change:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Change event '{change_id}' not found",
        )
    return change


@router.get("/api/investigations", response_model=List[InvestigationCase], tags=["Investigations"])
async def list_investigations(
    service: InvestigationService = Depends(get_investigation_service),
):
    """List all tracked change-impact investigations."""
    return await service.list_investigations()


@router.get("/api/investigations/{investigation_id}", response_model=InvestigationCase, tags=["Investigations"])
async def get_investigation(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve full details of an investigation including evidence-weighted hypothesis."""
    inv = await service.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return inv


@router.get(
    "/api/investigations/{investigation_id}/timeline",
    response_model=List[TimelineEvent],
    tags=["Investigations"],
)
async def get_investigation_timeline(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve multi-lane timeline events (CHANGE, TELEMETRY, AGENT, APPROVAL, BUSINESS, MEMORY)."""
    inv = await service.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return await service.get_timeline(investigation_id)


@router.get(
    "/api/investigations/{investigation_id}/graph",
    response_model=BlastRadiusGraph,
    tags=["Investigations"],
)
async def get_investigation_graph(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve blast-radius dependency graph linking changed resource to services and metrics."""
    inv = await service.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return await service.get_graph(investigation_id)


@router.get(
    "/api/investigations/{investigation_id}/evidence",
    response_model=List[EvidenceArtifact],
    tags=["Investigations"],
)
async def get_investigation_evidence(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Retrieve evidence artifacts with SHA-256 integrity hashes supporting the hypothesis."""
    inv = await service.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return await service.get_evidence(investigation_id)


@router.get(
    "/api/investigations/{investigation_id}/memory",
    response_model=List[OperationalMemory],
    tags=["Investigations"],
)
async def get_investigation_memory(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Recall relevant historical operational memories via Hindsight (or local fallback)."""
    inv = await service.get_investigation(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return await service.get_memories(investigation_id)


@router.post(
    "/api/investigations/{investigation_id}/evidence-pack",
    response_model=EvidencePack,
    tags=["Investigations"],
)
async def create_evidence_pack(
    investigation_id: str,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Generate and store an auditable Evidence Pack with SHA-256 content verification."""
    pack = await service.generate_evidence_pack(investigation_id)
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return pack


@router.post("/api/events/agent-action", response_model=AgentAction, tags=["Events"])
async def record_agent_action(
    action: AgentAction,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Record an AI agent action event to establish operational accountability."""
    return await service.record_agent_action(action)


@router.post("/api/events/approval", response_model=Approval, tags=["Events"])
async def record_approval(
    approval: Approval,
    service: InvestigationService = Depends(get_investigation_service),
):
    """Record an infrastructure change approval state (approved, rejected, missing, not_required)."""
    return await service.record_approval(approval)


@router.post("/api/demo/inject-change", response_model=InvestigationCase, tags=["Demo"])
async def inject_demo_change(
    service: InvestigationService = Depends(get_investigation_service),
):
    """Trigger the deterministic demo scenario: Lambda concurrency reduction causing throttling."""
    return await service.inject_demo_change()
