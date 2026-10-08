"""Tests for LangGraph order tracking and conversation workflows."""

import pytest
from unittest.mock import AsyncMock, patch
from langchain_core.messages import HumanMessage
from ai_contracts.models import OrderStatus
from ai_orchestrator.graph import build_support_graph


@pytest.mark.asyncio
async def test_order_status_missing_id_asks_clarification():
    graph = build_support_graph()
    initial_state = {
        "conversation_id": "conv-test-1",
        "customer_id": "cust-1",
        "channel": "web_chat",
        "messages": [HumanMessage(content="Where is my package?")],
    }

    result = await graph.ainvoke(
        initial_state, config={"configurable": {"thread_id": "conv-test-1"}}
    )

    assert result["active_intent"] == "order_status"
    assert "order_id" in result["missing_fields"]
    assert "clarifying_question" in result
    assert "ORD-1001" in result["final_response"]


@pytest.mark.asyncio
async def test_order_status_with_order_id_executes_tool_and_grounds():
    mock_order = OrderStatus(
        order_id="ORD-1001",
        status="shipped",
        carrier="FedEx",
        tracking_number="TRK-987654321",
        estimated_delivery="2026-08-10",
    )

    with patch(
        "ai_orchestrator.graph.integration_client.get_order_status",
        new_callable=AsyncMock,
        return_value=mock_order,
    ):
        graph = build_support_graph()
        initial_state = {
            "conversation_id": "conv-test-2",
            "customer_id": "cust-1",
            "channel": "web_chat",
            "messages": [HumanMessage(content="Check order ORD-1001")],
        }

        result = await graph.ainvoke(
            initial_state, config={"configurable": {"thread_id": "conv-test-2"}}
        )

        assert result["active_intent"] == "order_status"
        assert result["proposed_tool"] == "get_order_status"
        assert result["proposed_tool_input"] == {"order_id": "ORD-1001"}
        assert result["tool_result"]["success"] is True
        
        response = result["final_response"]
        assert "ORD-1001" in response
        assert "FedEx" in response
        assert ("2026-08-10" in response or "August 10" in response or "Aug 10" in response)


@pytest.mark.asyncio
async def test_multi_turn_order_lookup_across_checkpoints():
    mock_order = OrderStatus(
        order_id="ORD-1001",
        status="shipped",
        carrier="FedEx",
        tracking_number="TRK-987654321",
        estimated_delivery="2026-08-10",
    )

    with patch(
        "ai_orchestrator.graph.integration_client.get_order_status",
        new_callable=AsyncMock,
        return_value=mock_order,
    ):
        graph = build_support_graph()
        thread_id = "conv-multi-turn-99"

        # Turn 1: user asks without order id
        state_turn_1 = {
            "conversation_id": thread_id,
            "customer_id": "cust-1",
            "channel": "web_chat",
            "messages": [HumanMessage(content="Where is my shipment?")],
        }
        res_1 = await graph.ainvoke(
            state_turn_1, config={"configurable": {"thread_id": thread_id}}
        )
        assert "order_id" in res_1["missing_fields"]

        # Turn 2: user replies with order ID
        state_turn_2 = {
            "messages": [HumanMessage(content="It is ORD-1001")],
        }
        res_2 = await graph.ainvoke(
            state_turn_2, config={"configurable": {"thread_id": thread_id}}
        )

        assert res_2["entities"]["order_id"] == "ORD-1001"
        assert "FedEx" in res_2["final_response"]
        assert (
            "2026-08-10" in res_2["final_response"]
            or "August 10" in res_2["final_response"]
            or "Aug 10" in res_2["final_response"]
        )


@pytest.mark.asyncio
async def test_account_orders_graph_execution():
    mock_orders = [
        OrderStatus(
            order_id="ORD-1001",
            status="shipped",
            carrier="FedEx",
            tracking_number="TRK-111",
            estimated_delivery="2026-08-10",
        ),
        OrderStatus(
            order_id="ORD-1002",
            status="processing",
            carrier="",
            tracking_number="",
            estimated_delivery="2026-08-12",
        ),
    ]

    with patch(
        "ai_orchestrator.graph.integration_client.list_customer_orders",
        new_callable=AsyncMock,
        return_value=mock_orders,
    ):
        graph = build_support_graph()
        initial_state = {
            "conversation_id": "conv-test-orders",
            "customer_id": "CUST-1001",
            "channel": "web_chat",
            "messages": [HumanMessage(content="wht are my order in my account")],
        }

        result = await graph.ainvoke(
            initial_state, config={"configurable": {"thread_id": "conv-test-orders"}}
        )

        assert result["active_intent"] == "account_orders"
        assert result["proposed_tool"] == "list_customer_orders"
        assert result["proposed_tool_input"] == {"customer_id": "CUST-1001"}
        assert result["tool_result"]["success"] is True

        response = result["final_response"]
        assert "ORD-1001" in response
        assert "ORD-1002" in response
        assert "Shipped" in response or "shipped" in response
        assert "audit" not in response.lower()
        assert "multi-factor authentication" not in response.lower()


@pytest.mark.asyncio
async def test_subscription_tool_execution():
    mock_sub = {
        "subscriptionId": "SUB-9001",
        "customerId": "CUST-1001",
        "tier": "VIP Platinum",
        "status": "active",
        "monthlyPrice": 99,
        "slaLevel": "Zero-Latency SLA",
        "features": ["Dedicated Support Supervisor", "Hardware Priority"],
        "renewsAt": "2026-09-01",
    }

    with patch(
        "ai_orchestrator.graph.integration_client.get_customer_subscription",
        new_callable=AsyncMock,
        return_value=mock_sub,
    ):
        graph = build_support_graph()
        initial_state = {
            "conversation_id": "conv-test-sub",
            "customer_id": "CUST-1001",
            "channel": "web_chat",
            "proposed_tool": "get_customer_subscription",
            "proposed_tool_input": {"customer_id": "CUST-1001"},
            "messages": [HumanMessage(content="What is my current subscription plan?")],
        }

        result = await graph.ainvoke(
            initial_state, config={"configurable": {"thread_id": "conv-test-sub"}}
        )

        assert result["tool_result"]["success"] is True
        response = result["final_response"]
        assert "VIP Platinum" in response
        assert "$99" in response


