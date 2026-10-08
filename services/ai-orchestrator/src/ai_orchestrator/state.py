"""Support conversation state definition for LangGraph.
@see docs/07-ai-orchestrator.md
"""

from typing import Annotated, Any, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class SupportState(TypedDict, total=False):
    """Conversation state manipulated across graph nodes."""

    conversation_id: str
    customer_id: str
    channel: str
    messages: Annotated[list[BaseMessage], add_messages]
    active_intent: str
    secondary_intents: list[str]
    entities: dict[str, Any]
    missing_fields: list[str]
    authentication_level: int
    sentiment: str
    risk_level: str
    retrieved_documents: list[dict[str, Any]]
    proposed_tool: str | None
    proposed_tool_input: dict[str, Any] | None
    tool_result: dict[str, Any] | None
    requires_human: bool
    escalation_reason: str | None
    final_response: str | None
    clarifying_question: str | None
