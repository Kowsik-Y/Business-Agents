"""
LangChain Native Tools for AI Sales Assistant.
Compatible with LangGraph, LangChain ChatModels, and Model Context Protocol (MCP).
"""

from typing import Dict, Any
from langchain_core.tools import tool


@tool
def crm_lookup_lead(email: str) -> Dict[str, Any]:
    """Look up an existing lead or customer contact record by email address in CRM."""
    crm_db = {
        "alex@acmecorp.com": {
            "name": "Alex Mercer",
            "company": "Acme Corp",
            "title": "VP of Engineering",
            "annual_revenue": "$25M",
            "employees": 220,
            "lifecycle_stage": "Sales Qualified Lead",
            "previous_interactions": 3,
            "known_budget": 50000,
            "has_authority": True
        },
        "sarah@techflow.io": {
            "name": "Sarah Chen",
            "company": "TechFlow",
            "title": "Head of Product",
            "annual_revenue": "$8M",
            "employees": 45,
            "lifecycle_stage": "Lead",
            "previous_interactions": 1,
            "known_budget": 25000,
            "has_authority": True
        },
        "marcus@startupxyz.dev": {
            "name": "Marcus Lee",
            "company": "Startup XYZ",
            "title": "Junior Developer",
            "annual_revenue": "$100k",
            "employees": 4,
            "lifecycle_stage": "Inbound Subscriber",
            "previous_interactions": 0,
            "known_budget": 2000,
            "has_authority": False
        }
    }

    clean_email = email.lower().strip()
    if clean_email in crm_db:
        return {"found": True, "record": crm_db[clean_email]}

    domain = clean_email.split("@")[-1] if "@" in clean_email else "unknown.com"
    return {
        "found": False,
        "email": clean_email,
        "message": f"Lead {clean_email} is a new prospective account. Domain: {domain}"
    }


@tool
def enrich_company_profile(domain: str) -> Dict[str, Any]:
    """Enrich company profile with industry, funding, size, ARR, and tech stack."""
    clean_domain = domain.lower().replace("http://", "").replace("https://", "").split("/")[0]

    # Mock enrichment database with domain heuristics
    if "acmecorp" in clean_domain:
        return {
            "domain": clean_domain,
            "company_name": "Acme Corp",
            "industry": "Enterprise B2B SaaS & Cloud Security",
            "headcount": 220,
            "estimated_arr": "$25M",
            "funding_stage": "Series B ($18M)",
            "tech_stack": ["React", "FastAPI", "PostgreSQL", "AWS", "Kubernetes"],
            "growth_rate_yoy": "+45%",
            "pain_points": ["Manual multi-system workflow bottlenecks", "Slow customer onboarding"]
        }
    elif "techflow" in clean_domain:
        return {
            "domain": clean_domain,
            "company_name": "TechFlow",
            "industry": "FinTech / Payments API",
            "headcount": 45,
            "estimated_arr": "$8M",
            "funding_stage": "Series A ($5M)",
            "tech_stack": ["Next.js", "Python", "Stripe", "GCP"],
            "growth_rate_yoy": "+65%",
            "pain_points": ["Scaling support without linear headcount expansion"]
        }
    else:
        return {
            "domain": clean_domain,
            "company_name": clean_domain.split(".")[0].title(),
            "industry": "Technology / Software",
            "headcount": 35,
            "estimated_arr": "$2M - $5M",
            "funding_stage": "Seed",
            "tech_stack": ["TypeScript", "Python", "Cloud Services"],
            "growth_rate_yoy": "+30%",
            "pain_points": ["Operations automation", "Lead qualification efficiency"]
        }


@tool
def calculate_lead_score(company_size: int, budget: float, timeline_months: int, has_authority: bool) -> Dict[str, Any]:
    """Calculates quantitative BANT qualification score (0-100) based on budget, authority, need, and timeline."""
    score = 0
    # Authority (30 pts)
    if has_authority:
        score += 30

    # Budget (30 pts)
    if budget >= 50000:
        score += 30
    elif budget >= 20000:
        score += 20
    elif budget >= 5000:
        score += 10
    else:
        score += 2

    # Timeline (25 pts)
    if timeline_months <= 1:
        score += 25
    elif timeline_months <= 3:
        score += 20
    elif timeline_months <= 6:
        score += 10
    else:
        score += 5

    # Company Size (15 pts)
    if company_size >= 100:
        score += 15
    elif company_size >= 25:
        score += 10
    elif company_size >= 10:
        score += 5
    else:
        score += 2

    status = "qualified" if score >= 65 else ("nurture" if score >= 35 else "disqualified")

    return {
        "score": score,
        "status": status,
        "breakdown": {
            "authority_points": 30 if has_authority else 0,
            "budget_points": min(30, int(budget / 1666)) if budget else 0,
            "timeline_points": 25 if timeline_months <= 1 else (20 if timeline_months <= 3 else 10),
            "size_points": 15 if company_size >= 100 else (10 if company_size >= 25 else 5)
        }
    }


# List of all sales tools for binding to models / MCP
SALES_TOOLS = [crm_lookup_lead, enrich_company_profile, calculate_lead_score]
