"""Shared enums mirroring @csp/contracts enums."""

from enum import StrEnum


class Channel(StrEnum):
    WEB_CHAT = "web_chat"
    VOICE = "voice"
    EMAIL = "email"
    SMS = "sms"
    API = "api"


class ConversationStatus(StrEnum):
    ACTIVE = "active"
    WAITING_FOR_CUSTOMER = "waiting_for_customer"
    WAITING_FOR_AGENT = "waiting_for_agent"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"


class MessageRole(StrEnum):
    CUSTOMER = "customer"
    ASSISTANT = "assistant"
    AGENT = "agent"
    SYSTEM = "system"


class Sentiment(StrEnum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    FRUSTRATED = "frustrated"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EscalationReason(StrEnum):
    LOW_CONFIDENCE = "low_confidence"
    POLICY_VIOLATION = "policy_violation"
    CUSTOMER_REQUEST = "customer_request"
    HIGH_RISK_ACTION = "high_risk_action"
    CONFLICTING_INFORMATION = "conflicting_information"
    SENSITIVE_TOPIC = "sensitive_topic"
    REPEATED_FAILURE = "repeated_failure"
    APPROVAL_REQUIRED = "approval_required"


class AuthenticationLevel(int):  # noqa: N818
    """Authentication level: 0=anonymous, 1=recognized, 2=OTP, 3=strong."""

    pass


class VoiceSessionState(StrEnum):
    CONNECTING = "connecting"
    CALIBRATING = "calibrating"
    LISTENING = "listening"
    SPEECH_DETECTED = "speech_detected"
    TRANSCRIBING = "transcribing"
    THINKING = "thinking"
    SPEAKING = "speaking"
    INTERRUPTING = "interrupting"
    CLOSED = "closed"


class OrderStatusValue(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
