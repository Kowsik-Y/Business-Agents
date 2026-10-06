"""
Integration tests for LangGraph AI Sales Assistant workflow.
"""

import pytest
from langchain_core.messages import HumanMessage
from app.graph.sales_graph import sales_graph


def test_sales_graph_execution_qualified():
    initial_state = {
        "messages": [HumanMessage(content="Qualify enterprise lead alex@acmecorp.com")],
        "lead_input": {"email": "alex@acmecorp.com", "estimated_budget": 50000, "timeline_months": 2},
        "crm_record": {},
        "enriched_data": {},
        "qualification": {},
        "score": 0,
        "status": "",
        "outreach_plan": {},
        "current_node": "",
        "audit_trail": [],
        "error": None
    }
    config = {"configurable": {"thread_id": "test_thread_qualified"}}
    result = sales_graph.invoke(initial_state, config=config)

    assert result["status"] == "qualified"
    assert result["score"] >= 65
    assert "outreach_plan" in result
    assert "subject_line" in result["outreach_plan"]
    assert len(result["audit_trail"]) >= 4


def test_sales_graph_execution_nurture():
    initial_state = {
        "messages": [HumanMessage(content="Check lead info for info@startup.dev")],
        "lead_input": {"email": "info@startup.dev", "estimated_budget": 3000, "timeline_months": 8, "has_decision_authority": False},
        "crm_record": {},
        "enriched_data": {},
        "qualification": {},
        "score": 0,
        "status": "",
        "outreach_plan": {},
        "current_node": "",
        "audit_trail": [],
        "error": None
    }
    config = {"configurable": {"thread_id": "test_thread_nurture"}}
    result = sales_graph.invoke(initial_state, config=config)

    assert result["status"] in ("nurture", "disqualified")
    assert "outreach_plan" in result
