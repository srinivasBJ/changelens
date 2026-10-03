"""ChangeLens FastAPI application entry point.

AWS Change Impact & Operational Memory intelligence layer.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api.routes import router
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("changelens")


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Enforce strict anti-caching headers on dynamic API and health endpoints."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        if request.url.path.startswith("/api") or request.url.path == "/health":
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("ChangeLens starting in %s mode (region: %s)", settings.changelens_mode.upper(), settings.aws_region)
    logger.info("Operational memory bank: %s", settings.hindsight_bank_id)
    yield
    logger.info("ChangeLens shutting down.")


app = FastAPI(
    title="ChangeLens API",
    description="Evidence-driven operational intelligence layer above AWS observability connecting infrastructure changes, telemetry anomalies, dependency blast radius, and Hindsight operational memory.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enforce no-cache on dynamic endpoints
app.add_middleware(CacheControlMiddleware)

# Enable CORS for Next.js frontend and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include primary routes
app.include_router(router)

