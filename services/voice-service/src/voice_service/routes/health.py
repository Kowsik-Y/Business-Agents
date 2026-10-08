"""Health check routes for voice-service."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health/live")
async def health_live() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@router.get("/health/ready")
async def health_ready() -> dict[str, str]:
    """Readiness probe."""
    return {"status": "ok"}
