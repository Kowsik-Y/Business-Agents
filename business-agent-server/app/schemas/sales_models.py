"""
Pydantic Schemas for AI Sales Assistant (LangGraph + LangChain).
Handles input requests, lead qualification data, scoring, and outreach plans.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class QualificationStatus(str, Enum):
    QUALIFIED = "qualified"
    NURTURE = "nurture"
    DISQUALIFIED = "disqualified"


class LeadInput(BaseModel):
    """Input payload for capturing a sales lead."""
    email: str = Field(description="Lead contact email")
    name: Optional[str] = Field(default="", description="Contact full name")
    company: Optional[str] = Field(default="", description="Target company name")
    notes: Optional[str] = Field(default="", description="Initial notes, pain points or enquiry text")
    estimated_budget: Optional[float] = Field(default=0.0, description="Estimated budget in USD")
    timeline_months: Optional[int] = Field(default=3, description="Expected buying timeline in months")
    has_decision_authority: Optional[bool] = Field(default=True, description="Whether contact is a decision maker")


class LeadQualification(BaseModel):
    """BANT Qualification verdict produced by the qualification node."""
    budget_identified: bool = Field(description="Verified budget availability")
    budget_amount: float = Field(default=0.0)
    authority_verified: bool = Field(description="Decision making authority confirmed")
    need_assessment: str = Field(description="Core pain point analysis")
    timeline: str = Field(description="Purchase timeline description")
    qualification_score: int = Field(ge=0, le=100, description="Quantitative score from 0 to 100")
    status: QualificationStatus = Field(description="Status: qualified, nurture, or disqualified")
    summary: str = Field(description="Summary of qualification assessment")
    next_steps: List[str] = Field(default_factory=list, description="Follow-up action items")


class SalesOutreachPlan(BaseModel):
    """Personalized outreach draft produced by the outreach node."""
    subject_line: str = Field(description="Engaging subject line")
    personalized_hook: str = Field(description="Contextual hook referencing lead situation")
    value_proposition: str = Field(description="Specific value proposition tailored to company")
    call_to_action: str = Field(description="Clear call to action / meeting link request")
    full_email_body: str = Field(description="Complete ready-to-send email copy")


class SalesRunRequest(BaseModel):
    """REST request to trigger the Sales Assistant workflow."""
    prompt: Optional[str] = Field(default=None, description="Freeform prompt or message (e.g. 'Qualify lead Alex at alex@acmecorp.com')")
    lead: Optional[LeadInput] = Field(default=None, description="Structured lead data")
    session_id: Optional[str] = Field(default=None, description="Session thread ID for state checkpointing")


class SalesRunResponse(BaseModel):
    """REST response summarizing the LangGraph execution."""
    session_id: str
    status: str
    score: int
    qualification: Optional[Dict[str, Any]] = None
    outreach_plan: Optional[Dict[str, Any]] = None
    enriched_data: Optional[Dict[str, Any]] = None
    audit_log: List[str] = Field(default_factory=list)
    messages: List[Dict[str, Any]] = Field(default_factory=list)
