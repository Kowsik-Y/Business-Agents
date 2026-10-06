"""
Context, State, Memory, and Blackboard Architecture.
Taught in Module 4 (2:50-3:30) & Module 6 (3:30-4:20).

State Types:
1. Message History (Episodic Memory): Sequential conversation history.
2. Shared Blackboard (Semantic State): Key-value business artifacts passed between agents.
3. Handoff Audit Trail: History of inter-agent control transfers.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import time
import uuid

from app.schemas.router_models import AgentIdentifier, HandoffRecord


class ChatMessage(BaseModel):
    role: str = Field(description="system | user | assistant | tool")
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    timestamp: float = Field(default_factory=time.time)


class SharedBlackboard(BaseModel):
    """
    Multi-Agent Blackboard:
    Acts as the shared memory workspace where specialized agents read context
    and write domain artifacts (leads, campaign specs, query results, tickets, ops tasks).
    """
    active_lead: Optional[Dict[str, Any]] = None
    active_campaign: Optional[Dict[str, Any]] = None
    analytics_context: Optional[Dict[str, Any]] = None
    support_ticket: Optional[Dict[str, Any]] = None
    operations_incident: Optional[Dict[str, Any]] = None
    custom_variables: Dict[str, Any] = Field(default_factory=dict)


class SessionState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    active_agent: AgentIdentifier = AgentIdentifier.ROUTER
    messages: List[ChatMessage] = Field(default_factory=list)
    blackboard: SharedBlackboard = Field(default_factory=SharedBlackboard)
    handoff_history: List[HandoffRecord] = Field(default_factory=list)
    total_tokens_used: int = 0
    execution_step_count: int = 0

    def add_message(self, role: str, content: str, name: Optional[str] = None, tool_calls: Optional[List[Dict[str, Any]]] = None, tool_call_id: Optional[str] = None):
        msg = ChatMessage(
            role=role,
            content=content,
            name=name,
            tool_calls=tool_calls,
            tool_call_id=tool_call_id,
            timestamp=time.time()
        )
        self.messages.append(msg)
        self.updated_at = time.time()
        return msg

    def record_handoff(self, from_agent: AgentIdentifier, to_agent: AgentIdentifier, reason: str, context: Optional[Dict[str, Any]] = None) -> HandoffRecord:
        record = HandoffRecord(
            from_agent=from_agent,
            to_agent=to_agent,
            reason=reason,
            transferred_context=context or {}
        )
        self.handoff_history.append(record)
        self.active_agent = to_agent
        self.updated_at = time.time()
        return record

    def update_blackboard(self, key: str, value: Any):
        if hasattr(self.blackboard, key):
            setattr(self.blackboard, key, value)
        else:
            self.blackboard.custom_variables[key] = value
        self.updated_at = time.time()


class SessionStore:
    """Thread-safe in-memory session manager with lifecycle hooks"""
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create(self, session_id: Optional[str] = None) -> SessionState:
        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id=session_id)
        return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def reset(self, session_id: str) -> SessionState:
        new_state = SessionState(session_id=session_id)
        self._sessions[session_id] = new_state
        return new_state

    def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            {
                "session_id": s.session_id,
                "active_agent": s.active_agent.value,
                "message_count": len(s.messages),
                "created_at": s.created_at,
                "updated_at": s.updated_at
            }
            for s in self._sessions.values()
        ]


# Global session registry singleton
session_store = SessionStore()
