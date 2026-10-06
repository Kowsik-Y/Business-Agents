"""
Model Context Protocol (MCP) Resources for Sales Knowledge & Playbooks.
URI Scheme: business://sales/*
"""

from typing import Dict, Any, List

SALES_RESOURCES = {
    "business://sales/playbook": {
        "uri": "business://sales/playbook",
        "name": "B2B Sales Playbook & BANT Framework",
        "description": "Standard qualification framework covering Budget, Authority, Need, and Timeline evaluation.",
        "mimeType": "text/markdown",
        "text": """# AI Sales Assistant Playbook

## 1. Ideal Customer Profile (ICP)
- **Target Industries**: B2B SaaS, FinTech, Cloud Infrastructure, Developer Tools.
- **Headcount**: 25 - 500 employees.
- **Current Bottleneck**: Manual repetitive operations, slow customer support triage, fragmented sales qualification.

## 2. BANT Qualification Criteria
- **Budget (30 pts)**:
  - Enterprise Tier (> $50,000 ARR): Immediate fast-track.
  - Growth Tier ($20,000 - $50,000 ARR): Standard sales cycle.
  - Pilot Tier ($5,000 - $20,000 ARR): Self-serve / Assisted pilot.
- **Authority (30 pts)**:
  - C-Level, VP, Head of Product/Engineering: Full decision authority.
  - Senior Manager / Lead: Key champion; requires executive sponsor.
- **Need (20 pts)**:
  - Quantifiable workflow bottleneck (e.g. >10 hours/week spent on manual triage).
- **Timeline (20 pts)**:
  - Urgent (<= 30 days): Priority 1.
  - Moderate (1 - 3 months): Standard pipeline.
  - Distant (> 6 months): Nurture sequence.

## 3. Lead Thresholds
- **Score >= 65**: SALES QUALIFIED (Trigger executive personalized outreach).
- **Score 35 - 64**: NURTURE (Add to automated educational drip sequence).
- **Score < 35**: DISQUALIFIED (Archive with audit reasoning).
"""
    },
    "business://sales/pricing-tiers": {
        "uri": "business://sales/pricing-tiers",
        "name": "Platform Pricing & Licensing Tiers",
        "description": "Commercial pricing packages, agent limits, and enterprise SLAs.",
        "mimeType": "text/markdown",
        "text": """# Business Agents Platform Pricing

| Tier | Monthly / Annual | Agent Workflows | Features |
| :--- | :--- | :--- | :--- |
| **Starter** | $499/mo | Up to 3 Agents | Standard tools, community support, 10k actions/mo |
| **Growth** | $1,999/mo | Up to 10 Agents | Custom tools, WebSockets, MCP integration, 100k actions/mo |
| **Enterprise** | Custom ($25k - $120k ARR) | Unlimited | Dedicated VPC, LangGraph custom checkpoints, custom MCP servers, 99.99% SLA |
"""
    },
    "business://sales/objection-handling": {
        "uri": "business://sales/objection-handling",
        "name": "Sales Objection Handling Matrix",
        "description": "Battle cards and responses for common prospect objections.",
        "mimeType": "text/markdown",
        "text": """# Objection Handling Battle Cards

### Objection 1: "We are already using ChatGPT/Claude web interface."
- **Response**: Web interfaces are single-turn chat sessions without persistent business state, CRM integration, or autonomous tool execution. Our platform uses LangGraph state graphs with strict validation and bi-directional real-time WebSocket observability.

### Objection 2: "Security concerns about data sharing with LLMs."
- **Response**: We support self-hosted open models, zero-data-retention enterprise endpoints, and granular MCP tool-level permission gates. No customer data is used for model training.

### Objection 3: "Implementation time is too long."
- **Response**: Built-in MCP servers and LangChain tool adapters mean standard CRM and internal tool connectors deploy within hours, not months.
"""
    }
}


def list_resources() -> List[Dict[str, Any]]:
    return [
        {
            "uri": r["uri"],
            "name": r["name"],
            "description": r["description"],
            "mimeType": r["mimeType"]
        }
        for r in SALES_RESOURCES.values()
    ]


def get_resource(uri: str) -> Dict[str, Any]:
    if uri in SALES_RESOURCES:
        return SALES_RESOURCES[uri]
    raise KeyError(f"Resource '{uri}' not found")
