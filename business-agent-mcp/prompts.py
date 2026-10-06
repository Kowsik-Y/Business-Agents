"""
Model Context Protocol (MCP) Prompts for AI Sales Assistant.
"""

from typing import Dict, Any, List

MCP_PROMPTS = [
    {
        "name": "qualify-sales-lead",
        "description": "Evaluates inbound lead readiness using the BANT methodology.",
        "arguments": [
            {"name": "company", "description": "Target company name", "required": True},
            {"name": "contact_role", "description": "Job title or role", "required": True},
            {"name": "budget", "description": "Known or estimated budget", "required": False},
            {"name": "pain_point", "description": "Primary business bottleneck", "required": False}
        ]
    },
    {
        "name": "draft-sales-outreach",
        "description": "Generates high-converting, personalized cold outreach for qualified accounts.",
        "arguments": [
            {"name": "lead_name", "description": "Contact person's name", "required": True},
            {"name": "company", "description": "Company name", "required": True},
            {"name": "tech_stack", "description": "Key technologies used", "required": False},
            {"name": "pain_point", "description": "Addressed operational challenge", "required": False}
        ]
    }
]


def list_prompts() -> List[Dict[str, Any]]:
    return MCP_PROMPTS


def get_prompt_messages(name: str, arguments: Dict[str, Any]) -> List[Dict[str, Any]]:
    if name == "qualify-sales-lead":
        company = arguments.get("company", "the target company")
        role = arguments.get("contact_role", "Decision Maker")
        budget = arguments.get("budget", "unspecified")
        pain = arguments.get("pain_point", "scaling operational throughput")

        return [
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": (
                        f"Evaluate lead from {company} with title '{role}'. Budget is {budget}. "
                        f"Their main bottleneck is {pain}. Assess BANT criteria and compute qualification score."
                    )
                }
            }
        ]
    elif name == "draft-sales-outreach":
        name_str = arguments.get("lead_name", "there")
        company = arguments.get("company", "your team")
        tech = arguments.get("tech_stack", "cloud systems")
        pain = arguments.get("pain_point", "manual process delays")

        return [
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": (
                        f"Craft a high-converting 3-paragraph executive outreach email to {name_str} at {company}. "
                        f"Reference their tech stack ({tech}) and explain how AI Business Agents eliminate {pain}. "
                        f"End with a clear, low-friction 15-minute call invitation."
                    )
                }
            }
        ]
    raise ValueError(f"Prompt '{name}' not found")
