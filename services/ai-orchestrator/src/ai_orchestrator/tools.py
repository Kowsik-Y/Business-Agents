"""Tool definitions and registry for AI Orchestrator.
@see docs/07-ai-orchestrator.md, docs/11-integration-service.md
"""

from typing import Any
from ai_contracts.models import ToolDefinition

# Tool Catalog
ORDER_STATUS_TOOL = ToolDefinition(
    name="get_order_status",
    description="Retrieve canonical order shipping and delivery status by order ID.",
    input_schema={
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The unique order identifier, formatted like ORD-XXXX.",
                "example": "ORD-1001",
            }
        },
        "required": ["order_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "order_id": {"type": "string"},
            "status": {"type": "string", "enum": ["processing", "shipped", "delivered", "cancelled"]},
            "carrier": {"type": "string"},
            "tracking_number": {"type": "string"},
            "estimated_delivery": {"type": "string"},
        },
        "required": ["order_id", "status"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=10000,
    idempotent=True,
    audit_category="orders",
)

CANCEL_ORDER_TOOL = ToolDefinition(
    name="cancel_order",
    description="Cancel an active order or divert package shipment.",
    input_schema={
        "type": "object",
        "properties": {
            "order_id": {"type": "string"},
            "reason": {"type": "string"},
        },
        "required": ["order_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "order_id": {"type": "string"},
            "cancelled": {"type": "boolean"},
            "message": {"type": "string"},
        },
        "required": ["order_id", "cancelled"],
    },
    required_authentication_level=2,
    requires_confirmation=True,
    requires_human_approval=True,  # Four-Eyes Human Governance Required
    timeout=15000,
    idempotent=False,
    audit_category="orders",
)

SEARCH_KNOWLEDGE_TOOL = ToolDefinition(
    name="search_knowledge_base",
    description="Retrieve institutional knowledge regarding product features, pricing, troubleshooting, and warranty policies.",
    input_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "category": {"type": "string", "enum": ["pricing", "troubleshooting", "warranty", "account", "general"]},
        },
        "required": ["query"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "results": {"type": "array", "items": {"type": "string"}},
            "confidence": {"type": "number"},
        },
        "required": ["results"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=5000,
    idempotent=True,
    audit_category="knowledge",
)

LIST_CUSTOMER_ORDERS_TOOL = ToolDefinition(
    name="list_customer_orders",
    description="Retrieve all orders associated with the authenticated customer's account.",
    input_schema={
        "type": "object",
        "properties": {
            "customer_id": {
                "type": "string",
                "description": "The authenticated customer identifier, formatted like CUST-XXXX.",
                "example": "CUST-1001",
            }
        },
        "required": ["customer_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "orders": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string"},
                        "status": {"type": "string"},
                        "carrier": {"type": "string"},
                        "estimated_delivery": {"type": "string"},
                    },
                },
            },
            "count": {"type": "integer"},
        },
        "required": ["orders", "count"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=10000,
    idempotent=True,
    audit_category="orders",
)

GET_CUSTOMER_SUBSCRIPTION_TOOL = ToolDefinition(
    name="get_customer_subscription",
    description="Retrieve live subscription details, tier, SLA level, and feature entitlements for customer.",
    input_schema={
        "type": "object",
        "properties": {
            "customer_id": {"type": "string", "example": "CUST-1001"}
        },
        "required": ["customer_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "subscription_id": {"type": "string"},
            "tier": {"type": "string"},
            "status": {"type": "string"},
            "monthly_price": {"type": "number"},
            "sla_level": {"type": "string"},
            "renews_at": {"type": "string"},
        },
        "required": ["tier", "status"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=10000,
    idempotent=True,
    audit_category="subscriptions",
)

CHECK_WARRANTY_ELIGIBILITY_TOOL = ToolDefinition(
    name="check_warranty_eligibility",
    description="Check hardware warranty coverage and instant RMA replacement eligibility.",
    input_schema={
        "type": "object",
        "properties": {
            "customer_id": {"type": "string", "example": "CUST-1001"}
        },
        "required": ["customer_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "hardware_model": {"type": "string"},
            "is_covered": {"type": "boolean"},
            "rma_eligible": {"type": "boolean"},
            "expiration_date": {"type": "string"},
        },
        "required": ["hardware_model", "is_covered"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=10000,
    idempotent=True,
    audit_category="warranty",
)

CHECK_DEVICE_TELEMETRY_TOOL = ToolDefinition(
    name="check_device_telemetry",
    description="Retrieve real-time gateway device telemetry, network diagnostics, and IP calibration status.",
    input_schema={
        "type": "object",
        "properties": {
            "customer_id": {"type": "string", "example": "CUST-1001"}
        },
        "required": ["customer_id"],
    },
    output_schema={
        "type": "object",
        "properties": {
            "gateway_status": {"type": "string"},
            "ip_address": {"type": "string"},
            "calibration_status": {"type": "string"},
            "recommended_action": {"type": "string"},
        },
        "required": ["gateway_status"],
    },
    required_authentication_level=0,
    requires_confirmation=False,
    requires_human_approval=False,
    timeout=10000,
    idempotent=True,
    audit_category="telemetry",
)

TOOL_REGISTRY: dict[str, ToolDefinition] = {
    "get_order_status": ORDER_STATUS_TOOL,
    "cancel_order": CANCEL_ORDER_TOOL,
    "search_knowledge_base": SEARCH_KNOWLEDGE_TOOL,
    "list_customer_orders": LIST_CUSTOMER_ORDERS_TOOL,
    "get_customer_subscription": GET_CUSTOMER_SUBSCRIPTION_TOOL,
    "check_warranty_eligibility": CHECK_WARRANTY_ELIGIBILITY_TOOL,
    "check_device_telemetry": CHECK_DEVICE_TELEMETRY_TOOL,
}


def get_tool_definition(name: str) -> ToolDefinition | None:
    """Look up registered tool definition."""
    return TOOL_REGISTRY.get(name)
