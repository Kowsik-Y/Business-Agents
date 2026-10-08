"""Intent classification and entity extraction logic using LLM classification with deterministic fallback.
@see docs/07-ai-orchestrator.md
"""

import json
import re
from typing import Any
from pydantic import BaseModel, Field

from ai_orchestrator.llm import generate_chat_response
from ai_orchestrator.prompt_loader import load_prompt


class IntentResult(BaseModel):
    """Structured classification output."""

    active_intent: str
    secondary_intents: list[str] = Field(default_factory=list)
    entities: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    sentiment: str = "neutral"
    risk_level: str = "low"
    requires_human: bool = False
    escalation_reason: str | None = None


# Regex pattern for standard order numbers like ORD-1001 or ORD1001
ORDER_ID_PATTERN = re.compile(r"\b(ORD-?\d{4,8})\b", re.IGNORECASE)


async def classify_text_intent(
    text: str, existing_entities: dict[str, Any] | None = None
) -> IntentResult:
    """Classify user query intent using LLM with deterministic fallback."""
    entities: dict[str, Any] = dict(existing_entities or {})

    # Extract Order ID if present in utterance
    order_match = ORDER_ID_PATTERN.search(text)
    if order_match:
        raw_order = order_match.group(1).upper()
        if not raw_order.startswith("ORD-"):
            raw_order = f"ORD-{raw_order.replace('ORD', '')}"
        entities["order_id"] = raw_order

    # 1. Attempt LLM-driven classification
    system_prompt = load_prompt("intent_classifier")
    llm_prompt = f"User Utterance: {text}\nEntities Extracted So Far: {json.dumps(entities)}"
    try:
        raw_llm_res = await generate_chat_response(
            messages=[{"role": "user", "content": llm_prompt}],
            system_prompt=system_prompt,
            temperature=0.0,
        )
        if raw_llm_res:
            clean_json = raw_llm_res.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.strip("`").removeprefix("json").strip()
            parsed = json.loads(clean_json)
            active_intent = parsed.get("active_intent", "general_faq")

            llm_entities = parsed.get("entities", {})
            if isinstance(llm_entities, dict):
                entities.update(llm_entities)

            missing_fields = parsed.get("missing_fields", [])
            if active_intent in ("order_status", "order_cancellation") and "order_id" not in entities:
                if "order_id" not in missing_fields:
                    missing_fields.append("order_id")

            requires_human = bool(parsed.get("requires_human", False))
            escalation_reason = parsed.get("escalation_reason")

            if active_intent == "escalation_request":
                requires_human = True
                escalation_reason = "customer_requested"
            elif active_intent == "order_cancellation" and "order_id" in entities:
                requires_human = True
                escalation_reason = "sensitive_business_operation"
            elif requires_human and not escalation_reason:
                escalation_reason = "customer_requested"

            return IntentResult(
                active_intent=active_intent,
                entities=entities,
                missing_fields=missing_fields,
                sentiment=parsed.get("sentiment", "neutral"),
                risk_level=parsed.get("risk_level", "low"),
                requires_human=requires_human,
                escalation_reason=escalation_reason,
            )
    except Exception:
        pass

    # 2. Fallback Deterministic Classification (used when LLM mock mode is active or API is offline)
    return _classify_text_intent_fallback(text, entities)


def _classify_text_intent_fallback(
    text: str, entities: dict[str, Any]
) -> IntentResult:
    """Fallback classification for offline or mock environments."""
    normalized = text.lower().strip()

    # Sentiment check
    sentiment = "neutral"
    risk_level = "low"
    if any(w in normalized for w in ["angry", "terrible", "worst", "hate", "lawsuit", "unacceptable", "frustrated", "immediately"]):
        sentiment = "frustrated"
        risk_level = "high"

    # 1. Human Escalation Request
    if any(w in normalized for w in ["speak to human", "talk to agent", "human please", "representative", "supervisor", "transfer me", "switch to human", "connect me to agent"]):
        return IntentResult(
            active_intent="escalation_request",
            sentiment=sentiment,
            risk_level="medium",
            requires_human=True,
            escalation_reason="customer_requested",
            entities=entities,
        )

    # 2. Sensitive Order Cancellation or Modification
    cancel_keywords = ["cancel", "stop order", "abort", "refund", "change address", "redirect package", "modify order"]
    if any(w in normalized for w in cancel_keywords):
        missing_fields = []
        if "order_id" not in entities:
            missing_fields.append("order_id")
            return IntentResult(
                active_intent="order_cancellation",
                entities=entities,
                missing_fields=missing_fields,
                sentiment=sentiment,
                risk_level="medium",
            )
        else:
            return IntentResult(
                active_intent="order_cancellation",
                entities=entities,
                sentiment=sentiment,
                risk_level="high",
                requires_human=True,
                escalation_reason="sensitive_business_operation",
            )

    # 3. Account Orders Listing
    account_order_keywords = [
        "my orders", "all orders", "all order", "list orders", "list order",
        "what orders", "what order", "wht orders", "wht order", "order history", "orders history",
        "account orders", "account order", "show my orders", "show my order", "how many orders",
        "orders i have", "orders do i have", "order in my account", "orders in my account",
        "order on my account", "orders on my account", "my account orders", "my account order",
        "wht are my order", "what are my order", "wht are my orders", "what are my orders",
        "check my orders", "check my order", "view my orders", "view my order",
        "find my orders", "find my order", "get my orders", "get my order"
    ]
    has_order_term = any(w in normalized for w in ["order", "orders", "oder", "odrs"])
    has_account_term = any(w in normalized for w in ["account", "profile"])

    if any(w in normalized for w in account_order_keywords) or (has_order_term and has_account_term):
        return IntentResult(
            active_intent="account_orders",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 4. Order Status & Tracking
    order_keywords = ["order", "package", "tracking", "shipment", "delivery", "track", "where is my", "when will my", "ord-"]
    if any(w in normalized for w in order_keywords):
        missing_fields = []
        if "order_id" not in entities:
            missing_fields.append("order_id")
        return IntentResult(
            active_intent="order_status",
            entities=entities,
            missing_fields=missing_fields,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 5. Pricing & Subscriptions
    pricing_keywords = ["price", "pricing", "cost", "tier", "subscription", "upgrade", "plan", "billing", "monthly", "annual", "pay", "fee"]
    if any(w in normalized for w in pricing_keywords):
        return IntentResult(
            active_intent="pricing_subscriptions",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 6. Troubleshooting
    troubleshooting_keywords = ["troubleshoot", "error", "bug", "not working", "broken", "crash", "connect", "wifi", "network", "offline", "fail", "glitch"]
    if any(w in normalized for w in troubleshooting_keywords):
        return IntentResult(
            active_intent="troubleshooting",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 7. Warranty & Returns
    warranty_keywords = ["warranty", "guarantee", "return", "repair", "replace", "replacement", "defect", "rma", "hardware"]
    if any(w in normalized for w in warranty_keywords):
        return IntentResult(
            active_intent="warranty_returns",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 8. Account Issues
    account_keywords = ["account", "password", "email", "login", "profile", "change password", "sign in", "lock", "unlock"]
    if any(w in normalized for w in account_keywords):
        return IntentResult(
            active_intent="account_issues",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    # 9. Greeting
    if any(w in normalized for w in ["hi", "hello", "hey", "good morning", "good evening", "greetings"]):
        return IntentResult(
            active_intent="greeting",
            entities=entities,
            sentiment=sentiment,
            risk_level=risk_level,
        )

    return IntentResult(
        active_intent="general_faq",
        entities=entities,
        sentiment=sentiment,
        risk_level=risk_level,
    )
