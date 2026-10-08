"""Orchestrator Service
Executes turns through LangGraph and streams structured StreamEvent messages.
@see docs/07-ai-orchestrator.md, docs/14-api-contracts.md
"""

from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any
import uuid

from langchain_core.messages import HumanMessage
from ai_contracts.models import (
    AssistantTurnRequest,
    IntentDetectedEvent,
    StreamEvent,
    TextDeltaEvent,
    ToolCompletedEvent,
    ToolProposedEvent,
    TurnCompletedEvent,
    TurnFailedEvent,
)
from ai_orchestrator.graph import build_support_graph
from ai_orchestrator.state import SupportState


class OrchestratorService:
    """Coordinates conversation turn execution against LangGraph."""

    def __init__(self, checkpointer: Any | None = None) -> None:
        self.graph = build_support_graph(checkpointer=checkpointer)

    async def execute_turn_stream(
        self, request: AssistantTurnRequest
    ) -> AsyncGenerator[StreamEvent, None]:
        """Execute a conversation turn and stream typed SSE events."""
        turn_id = request.turn_id
        seq = 1

        try:
            # Prepare initial state inputs
            initial_state: SupportState = {
                "conversation_id": request.conversation_id,
                "customer_id": request.customer_id,
                "channel": str(request.channel.value if hasattr(request.channel, "value") else request.channel),
                "messages": [HumanMessage(content=request.message, id=request.message_id)],
                "authentication_level": request.authentication_level,
            }

            config = {"configurable": {"thread_id": request.conversation_id}}

            # Run LangGraph invocation
            result = await self.graph.ainvoke(initial_state, config=config)

            # 1. Intent detected event
            active_intent = result.get("active_intent", "general_faq")
            yield IntentDetectedEvent(
                turn_id=turn_id,
                sequence=seq,
                timestamp=datetime.now(timezone.utc),
                intent=active_intent,
                confidence=0.95,
            )
            seq += 1

            # 2. Tool proposed & completed events if tool was invoked
            proposed_tool = result.get("proposed_tool")
            if proposed_tool:
                yield ToolProposedEvent(
                    turn_id=turn_id,
                    sequence=seq,
                    timestamp=datetime.now(timezone.utc),
                    tool=proposed_tool,
                    arguments=result.get("proposed_tool_input", {}),
                )
                seq += 1

                tool_result = result.get("tool_result")
                yield ToolCompletedEvent(
                    turn_id=turn_id,
                    sequence=seq,
                    timestamp=datetime.now(timezone.utc),
                    tool=proposed_tool,
                    success=bool(tool_result and tool_result.get("success")),
                )
                seq += 1

            # 3. Handoff event if human agent escalation is required
            if result.get("requires_human"):
                from ai_contracts.models import HandoffRequiredEvent
                yield HandoffRequiredEvent(
                    turn_id=turn_id,
                    sequence=seq,
                    timestamp=datetime.now(timezone.utc),
                    reason=result.get("escalation_reason", "customer_requested"),
                    summary=result.get("summary", "Customer requested assistance from a human representative."),
                    active_intent=active_intent,
                    sentiment=result.get("sentiment", "neutral"),
                    risk_level=result.get("risk_level", "low"),
                    recommended_next_action="Review transcript and assist customer with their request.",
                )
                seq += 1

            # 4. Text delta events
            final_response = result.get("final_response") or "Thank you for contacting customer support."
            
            # Stream response in readable text chunks
            words = final_response.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i : i + chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield TextDeltaEvent(
                    turn_id=turn_id,
                    sequence=seq,
                    timestamp=datetime.now(timezone.utc),
                    content=chunk,
                )
                seq += 1

            # 4. Turn completed event
            yield TurnCompletedEvent(
                turn_id=turn_id,
                sequence=seq,
                timestamp=datetime.now(timezone.utc),
                response_id=f"resp_{uuid.uuid4().hex[:12]}",
            )

        except Exception as err:
            yield TurnFailedEvent(
                turn_id=turn_id,
                sequence=seq,
                timestamp=datetime.now(timezone.utc),
                error_code="INTERNAL_ERROR",
                error_message=str(err),
            )
