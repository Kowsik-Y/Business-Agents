"""Voice Session model, state machine, and session manager."""

import asyncio
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from typing import Any
from pydantic import BaseModel, Field


class VoiceSessionState(StrEnum):
    """Voice session state machine states."""

    CONNECTING = "connecting"
    CALIBRATING = "calibrating"
    LISTENING = "listening"
    SPEECH_DETECTED = "speech_detected"
    TRANSCRIBING = "transcribing"
    THINKING = "thinking"
    SPEAKING = "speaking"
    INTERRUPTING = "interrupting"
    CLOSED = "closed"


class VoiceSessionModel(BaseModel):
    """Voice session metadata model."""

    session_id: str
    conversation_id: str
    customer_id: str
    token: str
    ws_url: str
    state: VoiceSessionState = VoiceSessionState.CONNECTING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=15)
    )
    supported_codecs: list[str] = Field(default_factory=lambda: ["pcm_s16le", "opus"])


class ActiveSession:
    """Active runtime voice session with concurrency and cancellation locks."""

    def __init__(self, model: VoiceSessionModel) -> None:
        self.model = model
        self.state: VoiceSessionState = VoiceSessionState.CONNECTING
        self.active_response_id: str | None = None
        self.cancellation_token = asyncio.Event()
        self.lock = asyncio.Lock()

    def transition_to(self, new_state: VoiceSessionState) -> None:
        """Transition session to a new state."""
        self.state = new_state
        self.model.state = new_state

    def start_response(self, response_id: str) -> None:
        """Begin a new assistant response turn."""
        self.active_response_id = response_id
        self.cancellation_token.clear()

    def cancel_current_response(self) -> None:
        """Trigger barge-in cancellation."""
        self.cancellation_token.set()
        self.active_response_id = None
        self.transition_to(VoiceSessionState.INTERRUPTING)

    @property
    def is_cancelled(self) -> bool:
        return self.cancellation_token.is_set()


class SessionRegistry:
    """Registry managing active voice sessions."""

    def __init__(self) -> None:
        self._sessions: dict[str, ActiveSession] = {}

    def create(
        self,
        session_id: str,
        conversation_id: str,
        customer_id: str,
        token: str,
        ws_url: str,
    ) -> ActiveSession:
        model = VoiceSessionModel(
            session_id=session_id,
            conversation_id=conversation_id,
            customer_id=customer_id,
            token=token,
            ws_url=ws_url,
        )
        session = ActiveSession(model)
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> ActiveSession | None:
        return self._sessions.get(session_id)

    def remove(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def count(self) -> int:
        return len(self._sessions)


registry = SessionRegistry()
