import { LeadInput, SalesAssistantResult } from "./sales-types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" })
    return res.ok
  } catch {
    return false
  }
}

export async function runSalesAssistantRest(
  prompt: string,
  lead: LeadInput,
  sessionId: string
): Promise<SalesAssistantResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      lead,
      session_id: sessionId,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Server returned HTTP ${res.status}: ${errText}`)
  }

  return res.json()
}

export async function fetchSessionState(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/state/${sessionId}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch state for session ${sessionId}`)
  }

  return res.json()
}

export async function fetchSalesTools(): Promise<Array<{ name: string; description: string }>> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/tools`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch tools")
  }

  return res.json()
}
