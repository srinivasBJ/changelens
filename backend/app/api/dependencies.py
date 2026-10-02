"""FastAPI dependency injection providers."""

from functools import lru_cache
from app.services.investigation import InvestigationService


@lru_cache()
def get_investigation_service() -> InvestigationService:
    """Return singleton instance of InvestigationService."""
    return InvestigationService()
