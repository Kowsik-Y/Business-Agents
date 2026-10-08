"""Standard API error model mirroring @csp/contracts errors."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class ErrorCode(StrEnum):
    """Well-known error codes used across services."""

    VALIDATION_FAILED = "VALIDATION_FAILED"
    NOT_FOUND = "NOT_FOUND"
    NOT_AUTHORIZED = "NOT_AUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"

    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
    MESSAGE_NOT_FOUND = "MESSAGE_NOT_FOUND"
    CASE_NOT_FOUND = "CASE_NOT_FOUND"
    CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND"
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    TOOL_NOT_REGISTERED = "TOOL_NOT_REGISTERED"
    TOOL_NOT_AUTHORIZED = "TOOL_NOT_AUTHORIZED"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    ESCALATION_REQUIRED = "ESCALATION_REQUIRED"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"

    SESSION_EXPIRED = "SESSION_EXPIRED"
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"


class ErrorDetail(BaseModel):
    """Standard API error shape per docs/14-api-contracts.md."""

    code: str
    message: str
    correlation_id: str | None = None
    details: dict[str, object] | None = None
    model_config = ConfigDict(populate_by_name=True)


class ApiError(BaseModel):
    """Wrapper for the standard error shape."""

    error: ErrorDetail
