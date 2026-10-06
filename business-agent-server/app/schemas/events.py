"""
WebSocket Event Envelopes for streaming LangGraph execution steps.
"""

from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import time


class SalesEventType(str, Enum):
    CONNECTED = "connected"
    GRAPH_START = "graph_start"
    NODE_START = "node_start"
    NODE_COMPLETE = "node_complete"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    STATE_UPDATE = "state_update"
    OUTREACH_READY = "outreach_ready"
    ERROR = "error"
    GRAPH_COMPLETE = "graph_complete"


class SalesStreamEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{int(time.time()*1000)}")
    event_type: SalesEventType
    session_id: str
    node_name: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)
    payload: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "session_id": self.session_id,
            "node_name": self.node_name,
            "timestamp": self.timestamp,
            "payload": self.payload
        }
