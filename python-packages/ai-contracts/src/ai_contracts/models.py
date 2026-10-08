"""
Pydantic models for AI Orchestrator requests, responses, tools, and streaming events.

These mirror the TypeScript Zod schemas in @csp/contracts for cross-language type safety.
See docs/07-ai-orchestrator.md, docs/14-api-contracts.md.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from ai_contracts.enums import Channel, OrderStatusValue, VoiceSessionState


# ---------- Assistant Turn Request ----------


class ConversationContext(BaseModel):
    """Optional context included with an assistant turn request."""

    recent_order_ids: list[str] | None = None


class AssistantTurnRequest(BaseModel):
    """Request to start an assistant turn. See docs/14-api-contracts.md."""

    turn_id: str
    conversation_id: str
    customer_id: str
    channel: Channel = Channel.WEB_CHAT
    message_id: str
    message: str
    language: str = "en"
    authentication_level: int = 0
    context: ConversationContext | None = None


# ---------- Streaming Events ----------


class BaseStreamEvent(BaseModel):
    """Base for all streaming events."""

    type: str
    turn_id: str
    sequence: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TextDeltaEvent(BaseStreamEvent):
    """Incremental text content."""

    type: Literal["text.delta"] = "text.delta"
    content: str


class IntentDetectedEvent(BaseStreamEvent):
    """Intent classification result."""

    type: Literal["intent.detected"] = "intent.detected"
    intent: str
    confidence: float


class ToolProposedEvent(BaseStreamEvent):
    """AI proposes a tool call for authorization."""

    type: Literal["tool.proposed"] = "tool.proposed"
    tool: str
    arguments: dict[str, Any]
    requires_confirmation: bool = False
    requires_human_approval: bool = False


class ToolCompletedEvent(BaseStreamEvent):
    """Tool execution completed."""

    type: Literal["tool.completed"] = "tool.completed"
    tool: str
    success: bool


class HandoffRequiredEvent(BaseStreamEvent):
    """AI escalates conversation to a human agent."""

    type: Literal["handoff.required"] = "handoff.required"
    reason: str
    summary: str = ""
    active_intent: str | None = None
    sentiment: str = "neutral"
    risk_level: str = "low"
    recommended_next_action: str | None = None


class TurnCompletedEvent(BaseStreamEvent):
    """Turn finished successfully."""

    type: Literal["turn.completed"] = "turn.completed"
    response_id: str


class TurnFailedEvent(BaseStreamEvent):
    """Turn failed."""

    type: Literal["turn.failed"] = "turn.failed"
    error_code: str
    error_message: str


# Discriminated union of stream events
StreamEvent = (
    TextDeltaEvent
    | IntentDetectedEvent
    | ToolProposedEvent
    | ToolCompletedEvent
    | HandoffRequiredEvent
    | TurnCompletedEvent
    | TurnFailedEvent
)


# ---------- Handoff Package ----------


class HandoffPackage(BaseModel):
    """Structured handoff package for Agent Console. See docs/04-agent-console.md."""

    conversation_id: str
    case_id: str | None = None
    customer_id: str
    customer_name: str | None = None
    customer_email: str | None = None
    channel: str = "web_chat"
    authentication_level: int = 0
    active_intent: str | None = None
    secondary_intents: list[str] = Field(default_factory=list)
    sentiment: str = "neutral"
    risk_level: str = "low"
    summary: str = ""
    information_collected: dict[str, Any] = Field(default_factory=dict)
    missing_information: list[str] = Field(default_factory=list)
    actions_attempted: list[str] = Field(default_factory=list)
    relevant_business_objects: dict[str, Any] | None = None
    retrieved_sources: list[str] = Field(default_factory=list)
    escalation_reason: str = "customer_request"
    recommended_next_action: str | None = None
    pending_proposed_tool: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- Tool Definitions ----------


class ToolDefinition(BaseModel):
    """Registered tool definition. See docs/07-ai-orchestrator.md."""

    name: str
    description: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any] | None = None
    required_authentication_level: int = 0
    requires_confirmation: bool = False
    requires_human_approval: bool = False
    timeout: int = 30000
    idempotent: bool = False
    audit_category: str


class ToolRequest(BaseModel):
    """Request to execute a tool."""

    tool_name: str
    arguments: dict[str, Any]
    turn_id: str
    conversation_id: str
    customer_id: str
    idempotency_key: str | None = None


class ToolResponse(BaseModel):
    """Result of a tool execution."""

    tool_name: str
    success: bool
    data: Any | None = None
    error_code: str | None = None
    error_message: str | None = None
    execution_id: str
    duration_ms: int


class PolicyDecision(BaseModel):
    """Policy check result for a tool invocation."""

    id: str
    tool_name: str
    allowed: bool
    reason: str
    authentication_level: int
    required_level: int
    customer_ownership_verified: bool
    policy_rule_id: str | None = None
    requires_confirmation: bool = False
    requires_human_approval: bool = False
    decided_at: datetime


# ---------- Order Status ----------


class OrderStatus(BaseModel):
    """Canonical order status from Integration Service."""

    order_id: str
    status: OrderStatusValue
    carrier: str | None = None
    tracking_number: str | None = None
    estimated_delivery: str | None = None
    shipped_at: datetime | None = None
    delivered_at: datetime | None = None


# ---------- Voice ----------


class VoiceSession(BaseModel):
    """Voice session created by Core API."""

    session_id: str
    conversation_id: str
    customer_id: str
    token: str
    websocket_url: str
    expires_at: datetime
    supported_codecs: list[str] = Field(default_factory=lambda: ["pcm_s16le"])


class VoiceClientEvent(BaseModel):
    """Event sent from browser to voice service."""

    type: Literal["session.start", "response.cancel", "session.stop"]
    session_id: str
    timestamp: datetime
    response_id: str | None = None


class VoiceServerEvent(BaseModel):
    """Event sent from voice service to browser."""

    type: str
    session_id: str
    timestamp: datetime
    response_id: str | None = None
    content: str | None = None
    state: VoiceSessionState | None = None
    error_code: str | None = None
    error_message: str | None = None
