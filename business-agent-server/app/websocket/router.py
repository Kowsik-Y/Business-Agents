"""
WebSocket Router for Real-time Streaming of AI Sales Assistant.
Endpoint: /ws/sales/{session_id}
Streams node transitions, tool invocations, state updates, and outreach drafts.
"""

import json
import logging
from typing import Any, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage

from app.graph.sales_graph import sales_graph
from app.schemas.events import SalesStreamEvent, SalesEventType
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/sales/{session_id}")
async def sales_websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    Bi-directional streaming WebSocket endpoint for LangGraph Sales Assistant.
    Enables interactive frontend dashboards to visualize lead qualification in real-time.
    """
    await ws_manager.connect(session_id, websocket)

    # Send initial connection confirmation
    await ws_manager.send_event(
        session_id,
        SalesStreamEvent(
            event_type=SalesEventType.CONNECTED,
            session_id=session_id,
            payload={
                "message": f"Connected to AI Sales Assistant session '{session_id}'",
                "graph_nodes": ["capture_lead", "enrich_lead", "qualify_lead", "score_lead", "draft_outreach"]
            }
        )
    )

    try:
        while True:
            # Receive client prompt / action
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                data = {"prompt": data_text}

            action = data.get("action", "run")

            if action == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            # Process "run" action
            prompt = data.get("prompt", "")
            lead_data = data.get("lead", {})

            await ws_manager.send_event(
                session_id,
                SalesStreamEvent(
                    event_type=SalesEventType.GRAPH_START,
                    session_id=session_id,
                    payload={"prompt": prompt, "lead_input": lead_data}
                )
            )

            # Construct initial state
            initial_state = {
                "messages": [HumanMessage(content=prompt)] if prompt else [],
                "lead_input": lead_data,
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

            config = {"configurable": {"thread_id": session_id}}

            # Stream execution node-by-node using LangGraph astream
            latest_state = dict(initial_state)

            try:
                async for event in sales_graph.astream(initial_state, config=config, stream_mode="updates"):
                    # Event is a dictionary: {node_name: {updated_state_keys...}}
                    for node_name, node_output in event.items():
                        latest_state.update(node_output)

                        # Emit NODE_START / NODE_COMPLETE
                        await ws_manager.send_event(
                            session_id,
                            SalesStreamEvent(
                                event_type=SalesEventType.NODE_COMPLETE,
                                session_id=session_id,
                                node_name=node_name,
                                payload={
                                    "node": node_name,
                                    "output": {
                                        k: v for k, v in node_output.items() if k != "messages"
                                    }
                                }
                            )
                        )

                        # Emit specific business events based on node
                        if node_name == "enrich_lead":
                            await ws_manager.send_event(
                                session_id,
                                SalesStreamEvent(
                                    event_type=SalesEventType.TOOL_RESULT,
                                    session_id=session_id,
                                    node_name=node_name,
                                    payload={
                                        "crm_record": node_output.get("crm_record"),
                                        "enriched_data": node_output.get("enriched_data")
                                    }
                                )
                            )

                        elif node_name == "score_lead":
                            await ws_manager.send_event(
                                session_id,
                                SalesStreamEvent(
                                    event_type=SalesEventType.STATE_UPDATE,
                                    session_id=session_id,
                                    node_name=node_name,
                                    payload={
                                        "score": node_output.get("score"),
                                        "status": node_output.get("status"),
                                        "qualification": node_output.get("qualification")
                                    }
                                )
                            )

                        elif node_name == "draft_outreach":
                            await ws_manager.send_event(
                                session_id,
                                SalesStreamEvent(
                                    event_type=SalesEventType.OUTREACH_READY,
                                    session_id=session_id,
                                    node_name=node_name,
                                    payload=node_output.get("outreach_plan", {})
                                )
                            )

                # Emit final completion
                await ws_manager.send_event(
                    session_id,
                    SalesStreamEvent(
                        event_type=SalesEventType.GRAPH_COMPLETE,
                        session_id=session_id,
                        payload={
                            "status": latest_state.get("status"),
                            "score": latest_state.get("score"),
                            "qualification": latest_state.get("qualification"),
                            "outreach_plan": latest_state.get("outreach_plan"),
                            "audit_trail": latest_state.get("audit_trail", [])
                        }
                    )
                )

            except Exception as ex:
                logger.exception(f"Error during LangGraph streaming: {ex}")
                await ws_manager.send_event(
                    session_id,
                    SalesStreamEvent(
                        event_type=SalesEventType.ERROR,
                        session_id=session_id,
                        payload={"error": str(ex)}
                    )
                )

    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket unexpected error: {e}")
        ws_manager.disconnect(session_id, websocket)
