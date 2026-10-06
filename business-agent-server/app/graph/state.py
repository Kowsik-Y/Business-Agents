"""
LangGraph State Definition for AI Sales Assistant with Parallel Branches.
Uses TypedDict with operator.add reducers for message history and audit trails.
"""

from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage
import operator


class SalesAgentState(TypedDict):
    """
    Central State passed between LangGraph nodes during parallel sales automation.
    Tracks user intent, parallel tool findings, BANT assessment, score, and chat messages.
    """
    # Conversational chat messages with operator.add accumulator
    messages: Annotated[List[BaseMessage], operator.add]

    # Classified user intent: full_qualify | outreach_only | enrich_only | pricing_playbook | general_chat
    user_intent: str

    # Extracted or supplied lead parameters
    lead_input: Dict[str, Any]

    # Parallel Branch A: CRM record lookup
    crm_record: Dict[str, Any]

    # Parallel Branch B: Company tech stack, ARR, headcount enrichment
    enriched_data: Dict[str, Any]

    # Parallel Branch C: Sales playbook & BANT criteria evaluation
    playbook_context: Dict[str, Any]

    # Synthesized qualification assessment
    qualification: Dict[str, Any]

    # Quantitative score (0-100)
    score: int

    # Qualification verdict: "qualified" | "nurture" | "disqualified"
    status: str

    # Generated sales outreach email or strategy
    outreach_plan: Dict[str, Any]

    # Active executing node name
    current_node: str

    # Chronological execution audit log
    audit_trail: Annotated[List[str], operator.add]

    # Error message if any
    error: Optional[str]
