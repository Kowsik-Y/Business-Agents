"""Tests for intent classification and entity extraction."""

import pytest
from ai_orchestrator.intents import classify_text_intent


@pytest.mark.asyncio
async def test_classify_order_status_missing_id():
    result = await classify_text_intent("Where is my order?")
    assert result.active_intent == "order_status"
    assert "order_id" in result.missing_fields
    assert "order_id" not in result.entities


@pytest.mark.asyncio
async def test_classify_order_status_with_id():
    result = await classify_text_intent("Where is order ORD-1001?")
    assert result.active_intent == "order_status"
    assert result.entities.get("order_id") == "ORD-1001"
    assert "order_id" not in result.missing_fields


@pytest.mark.asyncio
async def test_extract_order_id_direct():
    result = await classify_text_intent("ORD-1002")
    assert result.active_intent == "order_status"
    assert result.entities.get("order_id") == "ORD-1002"
    assert len(result.missing_fields) == 0


@pytest.mark.asyncio
async def test_classify_escalation():
    result = await classify_text_intent("I want to speak to a human representative")
    assert result.active_intent == "escalation_request"
    assert result.requires_human is True
    assert result.escalation_reason == "customer_requested"


@pytest.mark.asyncio
async def test_classify_greeting():
    result = await classify_text_intent("Hello, good morning!")
    assert result.active_intent == "greeting"


@pytest.mark.asyncio
async def test_classify_account_orders():
    queries = [
        "wht are my order in my account",
        "what are my order in my account",
        "order in my account",
        "orders in my account",
        "my account order",
        "show my orders",
    ]
    for q in queries:
        res = await classify_text_intent(q)
        assert res.active_intent == "account_orders", f"Failed for query: {q}"
