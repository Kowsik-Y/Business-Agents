"""Voice session management endpoints."""

import secrets
import uuid
from typing import Annotated
from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel, Field
from voice_service.config import settings
from voice_service.session import VoiceSessionModel, registry

router = APIRouter(prefix="/internal/v1/voice/sessions", tags=["Voice Sessions"])


class CreateVoiceSessionRequest(BaseModel):
    conversation_id: str = Field(..., description="ID of the conversation thread")
    customer_id: str = Field(default="cust-anon", description="Customer identifier")


@router.post("", status_code=status.HTTP_201_CREATED, response_model=VoiceSessionModel)
async def create_voice_session(request: CreateVoiceSessionRequest) -> VoiceSessionModel:
    """Create a new short-lived voice session token and WebSocket URL."""
    session_id = f"vsession_{uuid.uuid4().hex[:12]}"
    token = f"vtoken_{secrets.token_urlsafe(24)}"
    ws_url = f"ws://localhost:{settings.port}/voice/v1/sessions/{session_id}"

    session = registry.create(
        session_id=session_id,
        conversation_id=request.conversation_id,
        customer_id=request.customer_id,
        token=token,
        ws_url=ws_url,
    )
    return session.model


@router.get("/{session_id}", response_model=VoiceSessionModel)
async def get_voice_session(
    session_id: Annotated[str, Path(description="Voice Session ID")]
) -> VoiceSessionModel:
    """Retrieve active voice session status."""
    session = registry.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voice session {session_id} not found",
        )
    return session.model


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice_session(
    session_id: Annotated[str, Path(description="Voice Session ID")]
) -> None:
    """Terminate and remove a voice session."""
    session = registry.get(session_id)
    if session:
        session.cancel_current_response()
        registry.remove(session_id)
