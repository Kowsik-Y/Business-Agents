"""
Model Context Protocol (MCP) Tools for AI Sales Assistant.
Exposes sales tools and the full LangGraph pipeline to any MCP client.
"""

import sys
import os
import json
from typing import Dict, Any, List

# Ensure access to server graph if executed in same environment
server_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "business-agent-server"))
if server_path not in sys.path:
    sys.path.insert(0, server_path)


MCP_TOOLS = [
    {
        "name": "crm_lookup_lead",
        "description": "Look up an existing lead or customer contact record by email address in CRM database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "Contact email address of the lead"
                }
            },
            "required": ["email"]
        }
    },
    {
        "name": "enrich_company_profile",
        "description": "Enrich company profile with industry, funding, size, ARR, and tech stack.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "Company web domain (e.g. acmecorp.com)"
                }
            },
            "required": ["domain"]
        }
    },
    {
        "name": "calculate_lead_score",
        "description": "Calculates quantitative BANT qualification score (0-100) based on budget, authority, need, and timeline.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "company_size": {
                    "type": "integer",
                    "description": "Total employee headcount of the target company"
                },
                "budget": {
                    "type": "number",
                    "description": "Identified budget amount in USD"
                },
                "timeline_months": {
                    "type": "integer",
                    "description": "Expected procurement timeline in months"
                },
                "has_authority": {
                    "type": "boolean",
                    "description": "Whether the contact has decision-making authority"
                }
            },
            "required": ["company_size", "budget", "timeline_months", "has_authority"]
        }
    },
    {
        "name": "run_sales_assistant",
        "description": "Executes the complete multi-step AI Sales Assistant LangGraph workflow (capture -> enrich -> qualify -> score -> outreach).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Natural language instruction or lead description"
                },
                "email": {
                    "type": "string",
                    "description": "Optional email of lead to qualify"
                }
            },
            "required": ["prompt"]
        }
    }
]


def list_tools() -> List[Dict[str, Any]]:
    return MCP_TOOLS


async def execute_tool(name: str, arguments: Dict[str, Any]) -> Any:
    if name == "crm_lookup_lead":
        from app.tools.sales_tools import crm_lookup_lead
        email = arguments.get("email", "")
        return crm_lookup_lead.invoke({"email": email})

    elif name == "enrich_company_profile":
        from app.tools.sales_tools import enrich_company_profile
        domain = arguments.get("domain", "")
        return enrich_company_profile.invoke({"domain": domain})

    elif name == "calculate_lead_score":
        from app.tools.sales_tools import calculate_lead_score
        return calculate_lead_score.invoke({
            "company_size": arguments.get("company_size", 30),
            "budget": arguments.get("budget", 10000.0),
            "timeline_months": arguments.get("timeline_months", 3),
            "has_authority": arguments.get("has_authority", True)
        })

    elif name == "run_sales_assistant":
        from app.graph.sales_graph import sales_graph
        from langchain_core.messages import HumanMessage
        prompt = arguments.get("prompt", "")
        email = arguments.get("email")

        lead_input = {"email": email} if email else {}
        initial_state = {
            "messages": [HumanMessage(content=prompt)],
            "lead_input": lead_input,
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
        config = {"configurable": {"thread_id": f"mcp_{os.getpid()}"}}
        result = await sales_graph.ainvoke(initial_state, config=config)
        return {
            "status": result.get("status"),
            "score": result.get("score"),
            "qualification": result.get("qualification"),
            "outreach_plan": result.get("outreach_plan"),
            "audit_trail": result.get("audit_trail")
        }

    raise ValueError(f"Unknown MCP tool: '{name}'")
