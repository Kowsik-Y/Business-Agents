"""Tests for Voice Session REST endpoints and session state transitions."""

import pytest
from fastapi.testclient import TestClient
from voice_service.main import app
from voice_service.session import VoiceSessionState, registry

client = TestClient(app)


def test_health_endpoints() -> None:
    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json() == {"status": "ok"}

    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json() == {"status": "ok"}


def test_create_and_get_session() -> None:
    payload = {
        "conversation_id": "conv_test_123",
        "customer_id": "cust_456",
    }
    response = client.post("/internal/v1/voice/sessions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert data["conversation_id"] == "conv_test_123"
    assert data["customer_id"] == "cust_456"
    assert "token" in data
    assert "ws_url" in data

    session_id = data["session_id"]

    # Fetch session
    get_res = client.get(f"/internal/v1/voice/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == session_id

    # Delete session
    del_res = client.delete(f"/internal/v1/voice/sessions/{session_id}")
    assert del_res.status_code == 204

    # Fetch after delete
    get_after = client.get(f"/internal/v1/voice/sessions/{session_id}")
    assert get_after.status_code == 404
