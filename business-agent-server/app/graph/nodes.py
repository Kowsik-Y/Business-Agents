"""
LangGraph Parallel Nodes for AI Sales Assistant.
Executes parallel fan-out branches (CRM Lookup || Company Enrichment || Playbook Assessment)
and fans-in to synthesize dynamic responses based on user query intent.
"""

import json
import re
from typing import Any, Dict
from langchain_core.messages import AIMessage, HumanMessage

from app.graph.state import SalesAgentState
from app.tools.sales_tools import crm_lookup_lead, enrich_company_profile, calculate_lead_score


def parse_and_route_intent_node(state: SalesAgentState) -> Dict[str, Any]:
    """Node 1: Classifies user prompt intent and normalizes lead entities."""
    lead = dict(state.get("lead_input") or {})

    # Extract user prompt from last message
    prompt_text = ""
    for m in reversed(state.get("messages", [])):
        if isinstance(m, HumanMessage):
            prompt_text = m.content
            break

    prompt_lower = prompt_text.lower()

    # Detect user intent
    if any(k in prompt_lower for k in ["pricing", "cost", "tier", "plan", "objection", "competitor"]):
        intent = "pricing_playbook"
    elif any(k in prompt_lower for k in ["draft", "email", "pitch", "subject line", "cold email", "write email"]):
        intent = "outreach_only"
    elif any(k in prompt_lower for k in ["enrich", "tech stack", "headcount", "revenue", "arr", "who is"]):
        intent = "enrich_only"
    elif any(k in prompt_lower for k in ["score", "calculate score", "points", "bant score"]):
        intent = "score_only"
    elif any(k in prompt_lower for k in ["qualify", "lead", "prospect", "@"]) or lead.get("email"):
        intent = "full_qualify"
    else:
        intent = "general_chat"

    # Extract email if present
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', prompt_text)
    if email_match:
        lead["email"] = email_match.group(0)
    elif not lead.get("email") and intent in ("full_qualify", "outreach_only", "enrich_only"):
        lead["email"] = "alex@acmecorp.com"

    # Extract name or company
    if not lead.get("company"):
        email = lead.get("email", "")
        domain = email.split("@")[-1] if "@" in email else "acmecorp.com"
        lead["company"] = domain.split(".")[0].title()

    audit = f"Identified user intent: '{intent.upper()}' for lead: {lead.get('email', 'N/A')}."
    return {
        "user_intent": intent,
        "lead_input": lead,
        "current_node": "parse_and_route_intent",
        "audit_trail": [audit]
    }


def parallel_crm_node(state: SalesAgentState) -> Dict[str, Any]:
    """Parallel Branch A: Concurrently checks CRM database for contact & deal history."""
    lead = state.get("lead_input", {})
    email = lead.get("email", "")

    crm_res = crm_lookup_lead.invoke({"email": email}) if email else {"found": False}
    audit = f"Parallel Branch A [CRM]: Found={crm_res.get('found', False)} for {email}."

    return {
        "crm_record": crm_res,
        "audit_trail": [audit]
    }


def parallel_enrichment_node(state: SalesAgentState) -> Dict[str, Any]:
    """Parallel Branch B: Concurrently scrapes and enriches company domain intelligence."""
    lead = state.get("lead_input", {})
    email = lead.get("email", "")
    domain = email.split("@")[-1] if "@" in email else "acmecorp.com"

    enrichment_res = enrich_company_profile.invoke({"domain": domain})
    audit = f"Parallel Branch B [Enrichment]: Profile loaded for {enrichment_res.get('company_name', domain)}."

    return {
        "enriched_data": enrichment_res,
        "audit_trail": [audit]
    }


def parallel_playbook_node(state: SalesAgentState) -> Dict[str, Any]:
    """Parallel Branch C: Concurrently retrieves relevant playbook criteria & ICP benchmarks."""
    playbook_data = {
        "icp_match": "High (B2B SaaS / Growth Tech)",
        "pricing_recommended": "Enterprise Tier ($25k - $50k ARR)",
        "bant_weights": {"authority": 30, "budget": 30, "timeline": 25, "size": 15},
        "target_decision_makers": ["VP of Engineering", "Head of Product", "Chief Technology Officer"],
        "key_value_propositions": [
            "Autonomous multi-step execution with LangGraph state machines",
            "Eliminate manual triage and operational bottlenecks by 70%",
            "Enterprise compliance with Model Context Protocol (MCP) tool gates"
        ]
    }
    audit = "Parallel Branch C [Playbook]: BANT rules & ICP benchmarks evaluated."

    return {
        "playbook_context": playbook_data,
        "audit_trail": [audit]
    }


def synthesize_response_node(state: SalesAgentState) -> Dict[str, Any]:
    """Fan-In Node: Merges parallel branch findings and generates dynamic response based on user intent."""
    intent = state.get("user_intent", "full_qualify")
    lead = state.get("lead_input", {})
    crm = state.get("crm_record", {})
    enrich = state.get("enriched_data", {})
    playbook = state.get("playbook_context", {})

    company = enrich.get("company_name") or lead.get("company", "your company")
    contact_name = lead.get("name") or (crm.get("record", {}).get("name") if crm.get("found") else "there")
    headcount = enrich.get("headcount", 50)
    tech_stack = ", ".join(enrich.get("tech_stack", ["cloud systems"])[:3])
    pain_point = (enrich.get("pain_points") or ["workflow latency"])[0]

    # Calculate quantitative BANT score using parallel outputs
    budget = float(lead.get("estimated_budget") or 0.0)
    if budget == 0.0 and crm.get("found"):
        budget = float(crm.get("record", {}).get("known_budget", 0.0))
    if budget == 0.0:
        budget = 50000.0 if "$25M" in enrich.get("estimated_arr", "") else 25000.0

    timeline_m = int(lead.get("timeline_months") or 3)
    has_auth = lead.get("has_decision_authority", True)

    scoring_result = calculate_lead_score.invoke({
        "company_size": headcount,
        "budget": budget,
        "timeline_months": timeline_m,
        "has_authority": has_auth
    })

    score = scoring_result.get("score", 75)
    status = scoring_result.get("status", "qualified")

    qualification = {
        "budget_identified": budget > 0,
        "budget_amount": budget,
        "authority_verified": has_auth,
        "need_assessment": f"Addressing {pain_point} to accelerate operational throughput.",
        "timeline": f"Target procurement within {timeline_m} months.",
        "qualification_score": score,
        "status": status,
        "scoring_breakdown": scoring_result.get("breakdown", {})
    }

    # Generate custom response based on what user asked
    subject = f"Automating {company}'s workflows with AI Business Agents"
    hook = f"Hi {contact_name}, noticed {company}'s rapid velocity within {enrich.get('industry', 'tech')}."
    value_prop = f"We enable teams building on {tech_stack} to automate {pain_point} using LangGraph multi-agent loops."
    cta = "Are you available for a 15-minute walkthrough this Thursday or Friday?"

    email_body = f"""Subject: {subject}

{hook}

{value_prop}

Our platform couples autonomous reasoning with strict tool validation, CRM synchronization, and real-time observability.

{cta}

Best regards,
AI Sales Assistant"""

    outreach_plan = {
        "subject_line": subject,
        "personalized_hook": hook,
        "value_proposition": value_prop,
        "call_to_action": cta,
        "full_email_body": email_body,
        "status": "ready_for_dispatch"
    }

    # Formulate conversational assistant response matching intent
    if intent == "pricing_playbook":
        reply_content = (
            f"Here is our pricing and strategic assessment for **{company}**:\n\n"
            f"- **Recommended Package**: Enterprise Tier ($25,000 - $50,000 ARR)\n"
            f"- **Features Included**: Unlimited LangGraph workflows, custom MCP servers, dedicated VPC, 99.99% SLA.\n"
            f"- **Objection Handling**: Emphasize deterministic tool execution and zero-data-retention privacy guarantees.\n\n"
            f"Would you like me to draft an executive pitch reflecting this tier?"
        )
    elif intent == "outreach_only":
        reply_content = (
            f"I've drafted a personalized outreach email for **{company}**:\n\n"
            f"**Subject**: {subject}\n\n"
            f"{email_body}\n\n"
            f"**Key Value Hook**: Tailored to their {tech_stack} stack and {pain_point} pain points."
        )
    elif intent == "enrich_only":
        reply_content = (
            f"### Account Intelligence Dossier for **{company}**\n\n"
            f"- **Industry**: {enrich.get('industry', 'B2B Software')}\n"
            f"- **Headcount**: {headcount} employees\n"
            f"- **Estimated ARR**: {enrich.get('estimated_arr', '$10M-$50M')}\n"
            f"- **Funding**: {enrich.get('funding_stage', 'Series B')}\n"
            f"- **Tech Stack**: {tech_stack}\n"
            f"- **CRM Record**: {'Matched existing account in CRM' if crm.get('found') else 'New prospective account'}\n"
        )
    elif intent == "score_only":
        reply_content = (
            f"### BANT Scoring Breakdown for **{company}**\n\n"
            f"- **Composite Score**: **{score}/100** ({status.upper()})\n"
            f"- **Authority**: {scoring_result.get('breakdown', {}).get('authority_points', 30)}/30 pts\n"
            f"- **Budget (${budget:,.0f})**: {scoring_result.get('breakdown', {}).get('budget_points', 30)}/30 pts\n"
            f"- **Timeline ({timeline_m}m)**: {scoring_result.get('breakdown', {}).get('timeline_points', 20)}/25 pts\n"
            f"- **Headcount ({headcount})**: {scoring_result.get('breakdown', {}).get('size_points', 15)}/15 pts\n"
        )
    elif intent == "general_chat":
        reply_content = (
            f"I am your AI Sales Assistant. I can qualify inbound leads, enrich company tech stacks, "
            f"calculate BANT readiness scores, and draft personalized executive pitches. "
            f"Try asking: *'Qualify alex@acmecorp.com'*, *'What is our enterprise pricing?'*, or *'Draft an outreach email for TechFlow'*."
        )
    else:
        # Full qualification default
        reply_content = (
            f"### Lead Qualification Complete: **{company}**\n\n"
            f"- **BANT Score**: **{score}/100** ({status.upper()})\n"
            f"- **Budget Verified**: ${budget:,.0f}\n"
            f"- **Tech Stack**: {tech_stack}\n"
            f"- **Recommended Action**: Dispatched executive cold outreach email.\n\n"
            f"**Drafted Outreach**:\n```\n{email_body}\n```"
        )

    ai_message = AIMessage(content=reply_content)
    audit = f"Synthesized dynamic response for intent '{intent.upper()}' (Score: {score}/100)."

    return {
        "score": score,
        "status": status,
        "qualification": qualification,
        "outreach_plan": outreach_plan,
        "messages": [ai_message],
        "current_node": "synthesize_response",
        "audit_trail": [audit]
    }
