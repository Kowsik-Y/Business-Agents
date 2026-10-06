"""
LangGraph Parallel StateGraph Compilation for AI Sales Assistant.
Architecture:
START -> parse_and_route_intent 
         ├──> parallel_crm ─────────────┐
         ├──> parallel_enrichment ──────┼──> synthesize_response -> END
         └──> parallel_playbook ────────┘
"""

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.graph.state import SalesAgentState
from app.graph.nodes import (
    parse_and_route_intent_node,
    parallel_crm_node,
    parallel_enrichment_node,
    parallel_playbook_node,
    synthesize_response_node,
)


def build_sales_graph(checkpointer: bool = True):
    """Builds and compiles the AI Sales Assistant LangGraph with parallel fan-out / fan-in."""
    workflow = StateGraph(SalesAgentState)

    # 1. Register Nodes
    workflow.add_node("parse_and_route_intent", parse_and_route_intent_node)
    workflow.add_node("parallel_crm", parallel_crm_node)
    workflow.add_node("parallel_enrichment", parallel_enrichment_node)
    workflow.add_node("parallel_playbook", parallel_playbook_node)
    workflow.add_node("synthesize_response", synthesize_response_node)

    # 2. Entry Edge
    workflow.add_edge(START, "parse_and_route_intent")

    # 3. Parallel Fan-Out Edges (concurrent execution)
    workflow.add_edge("parse_and_route_intent", "parallel_crm")
    workflow.add_edge("parse_and_route_intent", "parallel_enrichment")
    workflow.add_edge("parse_and_route_intent", "parallel_playbook")

    # 4. Fan-In Edges (joins all parallel branches into synthesis)
    workflow.add_edge("parallel_crm", "synthesize_response")
    workflow.add_edge("parallel_enrichment", "synthesize_response")
    workflow.add_edge("parallel_playbook", "synthesize_response")

    # 5. Conclude
    workflow.add_edge("synthesize_response", END)

    # 6. Checkpointer
    memory = MemorySaver() if checkpointer else None
    return workflow.compile(checkpointer=memory)


sales_graph = build_sales_graph(checkpointer=True)
