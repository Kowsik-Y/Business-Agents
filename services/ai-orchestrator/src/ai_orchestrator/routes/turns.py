"""Assistant turn execution and streaming endpoints.
@see docs/07-ai-orchestrator.md, docs/14-api-contracts.md
"""

from collections.abc import AsyncGenerator
import json
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
from ai_contracts.models import AssistantTurnRequest
from ai_orchestrator.orchestrator import OrchestratorService
from ai_orchestrator.security import detect_prompt_injection
from ai_orchestrator.routes.health import METRICS_STORE

router = APIRouter(prefix="/internal/v1/assistant", tags=["assistant"])
orchestrator = OrchestratorService()


@router.post("/turns")
async def start_assistant_turn(request: AssistantTurnRequest) -> EventSourceResponse:
    """Execute a single assistant turn and stream events over Server-Sent Events (SSE)."""
    METRICS_STORE["ai_orchestrator_requests_total"] += 1.0

    # Security check against prompt injections and jailbreak attacks
    is_malicious, reason = detect_prompt_injection(request.message)
    if is_malicious:
        METRICS_STORE["ai_policy_violations_total"] += 1.0
        raise HTTPException(status_code=400, detail=f"Security Policy Violation: {reason}")

    async def event_generator() -> AsyncGenerator[ServerSentEvent, None]:
        async for event in orchestrator.execute_turn_stream(request):
            yield ServerSentEvent(
                data=event.model_dump_json(),
                event=event.type,
                id=str(event.sequence),
            )

    return EventSourceResponse(event_generator())
