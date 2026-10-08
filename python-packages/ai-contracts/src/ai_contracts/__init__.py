"""
ai-contracts — Pydantic models mirroring @csp/contracts for Python services.

These models are the Python-side equivalent of the TypeScript Zod schemas
in packages/contracts. They are used by the AI Orchestrator, Knowledge Service,
and Voice Service.

See docs/07-ai-orchestrator.md, docs/14-api-contracts.md
"""

from ai_contracts.enums import (
    AuthenticationLevel,
    Channel,
    ConversationStatus,
    EscalationReason,
    MessageRole,
    OrderStatusValue,
    RiskLevel,
    Sentiment,
    VoiceSessionState,
)
from ai_contracts.errors import ApiError, ErrorCode
from ai_contracts.models import (
    AssistantTurnRequest,
    ConversationContext,
    IntentDetectedEvent,
    OrderStatus,
    PolicyDecision,
    StreamEvent,
    TextDeltaEvent,
    ToolCompletedEvent,
    ToolDefinition,
    ToolProposedEvent,
    ToolRequest,
    ToolResponse,
    TurnCompletedEvent,
    TurnFailedEvent,
    VoiceClientEvent,
    VoiceServerEvent,
    VoiceSession,
)

__all__ = [
    # Enums
    "AuthenticationLevel",
    "Channel",
    "ConversationStatus",
    "EscalationReason",
    "MessageRole",
    "OrderStatusValue",
    "RiskLevel",
    "Sentiment",
    "VoiceSessionState",
    # Errors
    "ApiError",
    "ErrorCode",
    # Models
    "AssistantTurnRequest",
    "ConversationContext",
    "IntentDetectedEvent",
    "OrderStatus",
    "PolicyDecision",
    "StreamEvent",
    "TextDeltaEvent",
    "ToolCompletedEvent",
    "ToolDefinition",
    "ToolProposedEvent",
    "ToolRequest",
    "ToolResponse",
    "TurnCompletedEvent",
    "TurnFailedEvent",
    "VoiceClientEvent",
    "VoiceServerEvent",
    "VoiceSession",
]
