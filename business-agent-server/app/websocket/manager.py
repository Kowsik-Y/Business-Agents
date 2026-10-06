"""
WebSocket Connection Manager for Streaming Sales Assistant Events.
Supports per-session connection tracking, broadcasting, and message routing.
"""

import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

from app.schemas.events import SalesStreamEvent

logger = logging.getLogger(__name__)


class SalesWebSocketManager:
    """Manages active WebSocket connections subscribed to specific sales assistant sessions."""

    def __init__(self):
        # Maps session_id -> Set of active WebSocket connections
        self._active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self._active_connections:
            self._active_connections[session_id] = set()
        self._active_connections[session_id].add(websocket)
        logger.info(f"WebSocket client connected to session '{session_id}' (Total: {len(self._active_connections[session_id])})")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self._active_connections:
            self._active_connections[session_id].discard(websocket)
            if not self._active_connections[session_id]:
                del self._active_connections[session_id]
        logger.info(f"WebSocket client disconnected from session '{session_id}'")

    async def send_event(self, session_id: str, event: SalesStreamEvent):
        """Sends an event to all subscribers of this session."""
        if session_id not in self._active_connections:
            return

        payload_json = json.dumps(event.to_dict())
        stale_sockets = []

        for ws in self._active_connections[session_id]:
            try:
                await ws.send_text(payload_json)
            except Exception as e:
                logger.warning(f"Failed to send to client on session {session_id}: {e}")
                stale_sockets.append(ws)

        for ws in stale_sockets:
            self.disconnect(session_id, ws)

    async def broadcast_raw(self, session_id: str, data: Dict[str, Any]):
        """Broadcasts arbitrary dictionary as JSON to all subscribers of this session."""
        if session_id not in self._active_connections:
            return

        text = json.dumps(data)
        stale_sockets = []
        for ws in self._active_connections[session_id]:
            try:
                await ws.send_text(text)
            except Exception:
                stale_sockets.append(ws)

        for ws in stale_sockets:
            self.disconnect(session_id, ws)


ws_manager = SalesWebSocketManager()
