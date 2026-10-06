export interface LeadInput {
  email: string
  name?: string
  company?: string
  notes?: string
  estimated_budget?: number
  timeline_months?: number
  has_decision_authority?: boolean
}

export interface QualificationData {
  budget_identified: boolean
  budget_amount?: number
  authority_verified: boolean
  need_assessment?: string
  timeline?: string
  timeline_months?: number
  qualification_score?: number
  status?: "qualified" | "nurture" | "disqualified"
  scoring_breakdown?: {
    authority_points?: number
    budget_points?: number
    timeline_points?: number
    size_points?: number
  }
}

export interface OutreachPlan {
  subject_line?: string
  personalized_hook?: string
  value_proposition?: string
  call_to_action?: string
  full_email_body?: string
  strategy?: string
  status?: string
}

export interface SalesAssistantResult {
  session_id: string
  user_intent?: string
  status: string
  score: number
  qualification?: QualificationData
  outreach_plan?: OutreachPlan
  enriched_data?: {
    company_name?: string
    industry?: string
    headcount?: number
    estimated_arr?: string
    funding_stage?: string
    tech_stack?: string[]
    pain_points?: string[]
  }
  crm_record?: {
    found: boolean
    record?: {
      name?: string
      company?: string
      title?: string
      annual_revenue?: string
      employees?: number
    }
  }
  playbook_context?: Record<string, unknown>
  audit_trail: string[]
  current_node?: string
  messages?: Array<{ type: string; content: string }>
}

export interface WebSocketStreamEvent {
  event_id: string
  event_type: string
  session_id: string
  node_name?: string
  timestamp: number
  payload: Record<string, unknown>
}

export interface ChatMessageItem {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  intent?: string
  resultSnapshot?: SalesAssistantResult
}
