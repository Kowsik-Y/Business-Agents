"""
Unit tests for AI Sales Assistant tools.
"""

import pytest
from app.tools.sales_tools import crm_lookup_lead, enrich_company_profile, calculate_lead_score


def test_crm_lookup_lead_found():
    result = crm_lookup_lead.invoke({"email": "alex@acmecorp.com"})
    assert result["found"] is True
    assert result["record"]["name"] == "Alex Mercer"
    assert result["record"]["company"] == "Acme Corp"


def test_crm_lookup_lead_new():
    result = crm_lookup_lead.invoke({"email": "unknown@newcorp.io"})
    assert result["found"] is False
    assert result["email"] == "unknown@newcorp.io"


def test_enrich_company_profile():
    result = enrich_company_profile.invoke({"domain": "acmecorp.com"})
    assert result["company_name"] == "Acme Corp"
    assert result["headcount"] == 220
    assert "tech_stack" in result


def test_calculate_lead_score_qualified():
    result = calculate_lead_score.invoke({
        "company_size": 150,
        "budget": 60000,
        "timeline_months": 2,
        "has_authority": True
    })
    assert result["score"] >= 70
    assert result["status"] == "qualified"


def test_calculate_lead_score_disqualified():
    result = calculate_lead_score.invoke({
        "company_size": 2,
        "budget": 500,
        "timeline_months": 12,
        "has_authority": False
    })
    assert result["score"] < 35
    assert result["status"] == "disqualified"
