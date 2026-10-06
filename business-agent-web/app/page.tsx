"use client"

import * as React from "react"
import { useSalesAssistant } from "@/hooks/use-sales-assistant"
import { ChatInterface } from "@/components/sales/chat-interface"
import { LeadForm } from "@/components/sales/lead-form"
import { PipelineVisualizer } from "@/components/sales/pipeline-visualizer"
import { ExecutionStream } from "@/components/sales/execution-stream"
import { QualificationVerdict } from "@/components/sales/qualification-verdict"
import { AccountIntelligence } from "@/components/sales/account-intelligence"
import { OutreachDraft } from "@/components/sales/outreach-draft"
import { McpExplorer } from "@/components/sales/mcp-explorer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SalesAssistantPage() {
  const {
    lead,
    setLead,
    presets,
    isRunning,
    activeMode,
    setActiveMode,
    activeNode,
    auditLogs,
    result,
    chatMessages,
    sendChatMessage,
    executeFromForm,
    reset,
  } = useSalesAssistant()

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top View Selector: Chat Mode vs Structured Form Mode */}
      <div className="mb-6">
        <Tabs defaultSelectedKey="chat">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger id="chat">💬 Conversational Assistant</TabsTrigger>
              <TabsTrigger id="form">📋 Structured Lead Form</TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Conversational Chat Interface */}
          <TabsContent id="chat">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Chat Assistant with Parallel LangGraph Engine */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <ChatInterface
                  messages={chatMessages}
                  isRunning={isRunning}
                  activeMode={activeMode}
                  onModeChange={setActiveMode}
                  onSendMessage={sendChatMessage}
                  onReset={reset}
                  activeNode={activeNode}
                />
              </div>

              {/* Right Column: Live Output & Intelligence Cards */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <QualificationVerdict result={result} />

                <AccountIntelligence enrichedData={result?.enriched_data} />

                <OutreachDraft outreachPlan={result?.outreach_plan} />

                <ExecutionStream
                  auditLogs={auditLogs}
                  isLive={isRunning || auditLogs.length > 0}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Structured Form & Pipeline Explorer Mode */}
          <TabsContent id="form">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <LeadForm
                  lead={lead}
                  onChange={setLead}
                  presets={presets}
                  activeMode={activeMode}
                  onModeChange={setActiveMode}
                  isRunning={isRunning}
                  onExecute={executeFromForm}
                />

                <PipelineVisualizer
                  activeNode={activeNode}
                  isFinished={result !== null}
                />

                <ExecutionStream
                  auditLogs={auditLogs}
                  isLive={isRunning || auditLogs.length > 0}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                <QualificationVerdict result={result} />

                <AccountIntelligence enrichedData={result?.enriched_data} />

                <OutreachDraft outreachPlan={result?.outreach_plan} />

                <McpExplorer result={result} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
