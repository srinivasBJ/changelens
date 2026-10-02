"""FastAPI dependency injection providers and security verification."""

import hmac
from functools import lru_cache
from typing import Optional

from fastapi import Header, HTTPException, status

from app.config import settings
from app.services.bedrock import BedrockService
from app.services.investigation import InvestigationService


@lru_cache()
def get_bedrock_service() -> BedrockService:
    """Return singleton instance of BedrockService."""
    return BedrockService()


@lru_cache()
def get_investigation_service() -> InvestigationService:
    """Return singleton instance of InvestigationService."""
    return InvestigationService()


async def verify_api_key(
    x_changelens_key: Optional[str] = Header(None, alias="X-ChangeLens-Key"),
) -> str:
    """Validate X-ChangeLens-Key header for protected mutating endpoints.

    Security guarantees:
    - Constant-time comparison using hmac.compare_digest to prevent timing attacks.
    - If CHANGELENS_API_KEY is not configured, fails closed with HTTP 403 Forbidden.
    - If X-ChangeLens-Key header is omitted, returns HTTP 401 Unauthorized.
    - If X-ChangeLens-Key header is invalid, returns HTTP 403 Forbidden.
    - Read-only endpoints are unaffected.
    """
    configured_key = settings.changelens_api_key

    # Fail closed if no key configured on the server
    if not configured_key or not configured_key.strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Protected mutating operations are disabled: CHANGELENS_API_KEY is not configured on the server.",
        )

    # Missing header -> 401 Unauthorized
    if not x_changelens_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Missing required 'X-ChangeLens-Key' header.",
        )

    # Constant-time comparison
    if not hmac.compare_digest(
        x_changelens_key.encode("utf-8"), configured_key.encode("utf-8")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid credentials provided in 'X-ChangeLens-Key' header.",
        )

    return x_changelens_key
