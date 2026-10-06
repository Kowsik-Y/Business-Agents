"""
REST API Endpoints for AI Sales Assistant (LangGraph & LangChain).
"""

import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage

from app.graph.sales_graph import sales_graph
from app.schemas.sales_models import SalesRunRequest, SalesRunResponse, LeadInput
from app.tools.sales_tools import SALES_TOOLS

router = APIRouter(prefix="/api/v1/sales", tags=["AI Sales Assistant"])


@router.post("/run", response_model=SalesRunResponse)
async def run_sales_assistant(request: SalesRunRequest) -> SalesRunResponse:
    """
    Executes the full AI Sales Assistant LangGraph workflow:
    Lead capture -> CRM enrichment -> BANT qualification -> Lead scoring -> Outreach generation.
    """
    session_id = request.session_id or f"sales_{uuid.uuid4().hex[:8]}"

    # Prepare inputs
    lead_data = request.lead.model_dump() if request.lead else {}
    messages = [HumanMessage(content=request.prompt)] if request.prompt else []

    initial_state = {
        "messages": messages,
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

    try:
        final_state = await sales_graph.ainvoke(initial_state, config=config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sales Assistant execution error: {str(e)}")

    formatted_messages = []
    for msg in final_state.get("messages", []):
        formatted_messages.append({
            "type": msg.__class__.__name__,
            "content": msg.content
        })

    return SalesRunResponse(
        session_id=session_id,
        status=final_state.get("status", "unknown"),
        score=final_state.get("score", 0),
        qualification=final_state.get("qualification"),
        outreach_plan=final_state.get("outreach_plan"),
        enriched_data=final_state.get("enriched_data"),
        audit_trail=final_state.get("audit_trail", []),
        messages=formatted_messages
    )


@router.post("/lead", response_model=SalesRunResponse)
async def capture_and_qualify_lead(lead: LeadInput) -> SalesRunResponse:
    """Convenience endpoint to qualify a structured lead directly."""
    req = SalesRunRequest(lead=lead)
    return await run_sales_assistant(req)


@router.get("/state/{session_id}")
async def get_session_state(session_id: str) -> Dict[str, Any]:
    """Inspects the checkpointed LangGraph state for a given session thread."""
    config = {"configurable": {"thread_id": session_id}}
    try:
        state_snapshot = sales_graph.get_state(config)
        if not state_snapshot or not state_snapshot.values:
            raise HTTPException(status_code=404, detail=f"No checkpoint found for session '{session_id}'")

        values = state_snapshot.values
        return {
            "session_id": session_id,
            "next_nodes": state_snapshot.next,
            "current_node": values.get("current_node"),
            "status": values.get("status"),
            "score": values.get("score"),
            "lead_input": values.get("lead_input"),
            "qualification": values.get("qualification"),
            "outreach_plan": values.get("outreach_plan"),
            "audit_trail": values.get("audit_trail", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving state: {str(e)}")


@router.get("/tools")
async def list_sales_tools() -> List[Dict[str, Any]]:
    """Lists all tools available to the AI Sales Assistant with parameters and descriptions."""
    tools_list = []
    for t in SALES_TOOLS:
        tools_list.append({
            "name": t.name,
            "description": t.description,
            "args_schema": str(t.args_schema) if t.args_schema else "Dynamic"
        })
    return tools_list
