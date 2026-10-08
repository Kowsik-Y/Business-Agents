"""Health check endpoints for AI Orchestrator.
@see docs/18-observability.md
"""

from fastapi import APIRouter, Response

router = APIRouter(prefix="/health", tags=["health"])

# Simple memory metrics store for OTel/Prometheus export in Python services
METRICS_STORE: dict[str, float] = {
    "ai_orchestrator_requests_total": 0.0,
    "ai_policy_violations_total": 0.0,
    "ai_turn_latency_seconds_sum": 0.0,
    "ai_turn_latency_seconds_count": 0.0,
}


@router.get("/live")
async def health_live() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@router.get("/ready")
async def health_ready() -> dict[str, str]:
    """Readiness probe."""
    return {"status": "ok", "service": "ai-orchestrator"}


@router.get("/metrics")
async def health_metrics() -> Response:
    """Prometheus metrics exporter endpoint."""
    lines: list[str] = [
        "# HELP ai_orchestrator_requests_total Total assistant turns attempted",
        "# TYPE ai_orchestrator_requests_total counter",
        f'ai_orchestrator_requests_total{{service="ai-orchestrator"}} {int(METRICS_STORE["ai_orchestrator_requests_total"])}',
        "# HELP ai_policy_violations_total Total security and prompt injection blocks",
        "# TYPE ai_policy_violations_total counter",
        f'ai_policy_violations_total{{service="ai-orchestrator"}} {int(METRICS_STORE["ai_policy_violations_total"])}',
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")
