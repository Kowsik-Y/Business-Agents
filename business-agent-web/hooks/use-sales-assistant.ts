"use client"

import * as React from "react"
import {
  LeadInput,
  QualificationData,
  OutreachPlan,
  SalesAssistantResult,
  WebSocketStreamEvent,
  ChatMessageItem,
} from "@/lib/sales-types"
import { runSalesAssistantRest, checkServerHealth } from "@/lib/api"

export const DEFAULT_PRESETS: Array<{ label: string; lead: LeadInput }> = [
  {
    label: "Enterprise Lead (Acme Corp)",
    lead: {
      email: "alex@acmecorp.com",
      name: "Alex Mercer",
      company: "Acme Corp",
      estimated_budget: 50000,
      timeline_months: 2,
      has_decision_authority: true,
      notes: "VP of Engineering evaluating workflow automation to eliminate manual onboarding bottlenecks.",
    },
  },
  {
    label: "Growth Lead (TechFlow)",
    lead: {
      email: "sarah@techflow.io",
      name: "Sarah Chen",
      company: "TechFlow",
      estimated_budget: 25000,
      timeline_months: 3,
      has_decision_authority: true,
      notes: "Head of Product looking to scale customer operations without adding proportional headcount.",
    },
  },
  {
    label: "Early Stage (Startup XYZ)",
    lead: {
      email: "marcus@startupxyz.dev",
      name: "Marcus Lee",
      company: "Startup XYZ",
      estimated_budget: 2000,
      timeline_months: 12,
      has_decision_authority: false,
      notes: "Junior developer exploring self-hosted tools with minimal budget.",
    },
  },
]

const INITIAL_MESSAGE: ChatMessageItem = {
  id: "msg_init",
  role: "assistant",
  content:
    "Hello! I am your AI Sales Assistant powered by parallel LangGraph execution. " +
    "I concurrently evaluate CRM deal history, company tech stack & ARR signals, and BANT playbooks to give you dynamic, tailored responses.\n\n" +
    "Try asking:\n" +
    "• *'Qualify prospect alex@acmecorp.com'*\n" +
    "• *'What is our enterprise pricing and objection handling for TechFlow?'*\n" +
    "• *'Draft a personalized outreach pitch for Acme Corp'*",
  timestamp: new Date(),
}

export function useSalesAssistant() {
  const [lead, setLead] = React.useState<LeadInput>(DEFAULT_PRESETS[0].lead)
  const [isRunning, setIsRunning] = React.useState(false)
  const [activeMode, setActiveMode] = React.useState<"websocket" | "rest">("websocket")
  const [activeNode, setActiveNode] = React.useState<string>("")
  const [auditLogs, setAuditLogs] = React.useState<string[]>([])
  const [result, setResult] = React.useState<SalesAssistantResult | null>(null)
  const [wsStatus, setWsStatus] = React.useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [serverOnline, setServerOnline] = React.useState<boolean>(true)
  const [chatMessages, setChatMessages] = React.useState<ChatMessageItem[]>([INITIAL_MESSAGE])

  const socketRef = React.useRef<WebSocket | null>(null)

  // Periodic health check
  React.useEffect(() => {
    let mounted = true
    const check = async () => {
      const ok = await checkServerHealth()
      if (mounted) setServerOnline(ok)
    }
    check()
    const timer = setInterval(check, 10000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const reset = React.useCallback(() => {
    setResult(null)
    setAuditLogs([])
    setActiveNode("")
    setIsRunning(false)
    setChatMessages([INITIAL_MESSAGE])
  }, [])

  const runRest = React.useCallback(
    async (prompt: string, targetLead: LeadInput, sessionId: string) => {
      setIsRunning(true)
      setActiveNode("parse_and_route_intent")
      setAuditLogs((prev) => [
        ...prev,
        `[REST] Dispatched prompt: '${prompt.slice(0, 40)}...' to LangGraph engine...`,
      ])

      try {
        const data = await runSalesAssistantRest(prompt, targetLead, sessionId)
        setResult(data)
        setActiveNode("complete")

        // Find assistant response message
        const lastMsg = data.messages?.slice(-1)[0]
        const replyText =
          lastMsg?.content ||
          `Completed parallel evaluation for ${targetLead.company || targetLead.email}. Score: ${data.score}/100 (${data.status.toUpperCase()}).`

        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: replyText,
            timestamp: new Date(),
            intent: data.user_intent,
            resultSnapshot: data,
          },
        ])

        setAuditLogs((prev) => [
          ...prev,
          ...data.audit_trail.map((a) => `[AUDIT] ${a}`),
          `[REST COMPLETE] Synthesized response for intent: ${data.user_intent || "GENERAL"}`,
        ])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setAuditLogs((prev) => [...prev, `[REST ERROR] ${msg}`])
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: "assistant",
            content: `⚠️ Error executing request: ${msg}. Make sure the backend is running at http://localhost:8000.`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsRunning(false)
      }
    },
    []
  )

  const runWebSocket = React.useCallback(
    (prompt: string, targetLead: LeadInput, sessionId: string) => {
      setIsRunning(true)
      setActiveNode("parse_and_route_intent")
      setAuditLogs((prev) => [...prev, `[INIT] Opening WebSocket connection: ${sessionId}...`])

      const wsUrl = `ws://localhost:8000/ws/sales/${sessionId}`

      try {
        const ws = new WebSocket(wsUrl)
        socketRef.current = ws

        ws.onopen = () => {
          setWsStatus("connected")
          setAuditLogs((prev) => [...prev, `[WS] Connected. Running parallel fan-out branches...`])

          const payload = {
            action: "run",
            prompt,
            lead: targetLead,
          }
          ws.send(JSON.stringify(payload))
        }

        ws.onmessage = (event) => {
          try {
            const streamEvt: WebSocketStreamEvent = JSON.parse(event.data)

            if (streamEvt.event_type === "node_complete" && streamEvt.node_name) {
              setActiveNode(streamEvt.node_name)
              setAuditLogs((prev) => [
                ...prev,
                `[PARALLEL NODE] Completed branch: ${streamEvt.node_name}`,
              ])
            } else if (streamEvt.event_type === "tool_result") {
              setAuditLogs((prev) => [
                ...prev,
                `[PARALLEL SIGNALS] Ingested CRM history and enriched domain profile.`,
              ])
            } else if (streamEvt.event_type === "state_update") {
              const p = streamEvt.payload
              setAuditLogs((prev) => [
                ...prev,
                `[BANT SCORE] ${p.score}/100 -> Status: ${String(p.status).toUpperCase()}`,
              ])
            } else if (streamEvt.event_type === "outreach_ready") {
              setAuditLogs((prev) => [...prev, `[OUTREACH] Executive pitch synthesized.`])
            } else if (streamEvt.event_type === "graph_complete") {
              const finalPayload = streamEvt.payload as Record<string, unknown>
              const resData: SalesAssistantResult = {
                session_id: streamEvt.session_id,
                user_intent: finalPayload.user_intent as string | undefined,
                status: String(finalPayload.status || "qualified"),
                score: Number(finalPayload.score || 0),
                qualification: finalPayload.qualification as QualificationData | undefined,
                outreach_plan: finalPayload.outreach_plan as OutreachPlan | undefined,
                enriched_data: finalPayload.enriched_data as SalesAssistantResult["enriched_data"],
                crm_record: finalPayload.crm_record as SalesAssistantResult["crm_record"],
                audit_trail: (finalPayload.audit_trail as string[]) || [],
              }

              setResult(resData)
              setAuditLogs((prev) => [
                ...prev,
                `[COMPLETE] Parallel branches joined into synthesized response.`,
              ])

              // Add response to chat
              const responseText =
                resData.outreach_plan?.full_email_body ||
                `Completed assessment for ${targetLead.company || "prospect"}. BANT Score: ${resData.score}/100 (${resData.status.toUpperCase()}).`

              setChatMessages((prev) => [
                ...prev,
                {
                  id: `msg_res_${Date.now()}`,
                  role: "assistant",
                  content: responseText,
                  timestamp: new Date(),
                  intent: resData.user_intent,
                  resultSnapshot: resData,
                },
              ])

              setIsRunning(false)
              setActiveNode("complete")
              ws.close()
            } else if (streamEvt.event_type === "error") {
              setAuditLogs((prev) => [...prev, `[ERROR] ${JSON.stringify(streamEvt.payload)}`])
              setIsRunning(false)
            }
          } catch {
            // Non-JSON frame
          }
        }

        ws.onerror = () => {
          setWsStatus("disconnected")
          setAuditLogs((prev) => [
            ...prev,
            `[WS ERROR] WebSocket offline. Falling back to REST API...`,
          ])
          runRest(prompt, targetLead, sessionId)
        }

        ws.onclose = () => {
          setWsStatus("disconnected")
        }
      } catch {
        runRest(prompt, targetLead, sessionId)
      }
    },
    [runRest]
  )

  const sendChatMessage = React.useCallback(
    (promptText: string) => {
      const trimmed = promptText.trim()
      if (!trimmed || isRunning) return

      // Add user message
      const userMsg: ChatMessageItem = {
        id: `msg_user_${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMsg])

      // Execute through graph
      const sessionId = `chat_${Date.now()}`
      if (activeMode === "websocket") {
        runWebSocket(trimmed, lead, sessionId)
      } else {
        runRest(trimmed, lead, sessionId)
      }
    },
    [isRunning, activeMode, lead, runWebSocket, runRest]
  )

  const executeFromForm = React.useCallback(() => {
    const prompt = `Qualify lead ${lead.name || "Contact"} from ${lead.company} (${lead.email}). Notes: ${lead.notes || "Standard inbound evaluation"}`
    sendChatMessage(prompt)
  }, [lead, sendChatMessage])

  return {
    lead,
    setLead,
    presets: DEFAULT_PRESETS,
    isRunning,
    activeMode,
    setActiveMode,
    activeNode,
    auditLogs,
    result,
    wsStatus,
    serverOnline,
    chatMessages,
    sendChatMessage,
    executeFromForm,
    reset,
  }
}
