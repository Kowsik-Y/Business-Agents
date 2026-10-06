"""
Integration tests for FastAPI REST Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["agent"] == "AI Sales Assistant"


def test_list_tools_endpoint():
    response = client.get("/api/v1/sales/tools")
    assert response.status_code == 200
    tools = response.json()
    assert len(tools) >= 3
    tool_names = [t["name"] for t in tools]
    assert "crm_lookup_lead" in tool_names
    assert "enrich_company_profile" in tool_names
    assert "calculate_lead_score" in tool_names


def test_run_sales_assistant_endpoint():
    payload = {
        "prompt": "Evaluate new inbound lead Sarah from TechFlow: sarah@techflow.io",
        "session_id": "test_api_session_001"
    }
    response = client.post("/api/v1/sales/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test_api_session_001"
    assert "status" in data
    assert "score" in data
    assert "outreach_plan" in data


def test_get_session_state_endpoint():
    # First invoke a run
    payload = {
        "prompt": "Evaluate lead alex@acmecorp.com",
        "session_id": "test_state_check_001"
    }
    client.post("/api/v1/sales/run", json=payload)

    # Now inspect state
    response = client.get("/api/v1/sales/state/test_state_check_001")
    assert response.status_code == 200
    state = response.json()
    assert state["session_id"] == "test_state_check_001"
    assert "score" in state
    assert len(state["audit_trail"]) > 0
