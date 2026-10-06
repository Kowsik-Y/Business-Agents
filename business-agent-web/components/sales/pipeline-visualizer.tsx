"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Activity, Layers } from "lucide-react"

interface PipelineVisualizerProps {
  activeNode: string
  isFinished: boolean
}

const STEPS = [
  { id: "capture_lead", label: "1. Capture & Normalize Lead", desc: "Extracts contact & domain" },
  { id: "enrich_lead", label: "2. Enrich Profile", desc: "CRM lookup & company tech stack" },
  { id: "qualify_lead", label: "3. Qualify BANT", desc: "Budget, Authority, Need, Timeline" },
  { id: "score_lead", label: "4. Quantitative Scoring", desc: "Weighted algorithm (0-100)" },
  { id: "draft_outreach", label: "5. Route & Draft Outreach", desc: "Personalized cold pitch" },
]

export function PipelineVisualizer({ activeNode, isFinished }: PipelineVisualizerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LangGraph State Machine</CardTitle>
        <CardDescription>
          Autonomous execution path through deterministic state nodes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {STEPS.map((step, idx) => {
            const isCurrent = activeNode === step.id
            const isCompleted =
              isFinished ||
              activeNode === "complete" ||
              (activeNode === "draft_outreach" && idx < 4) ||
              (activeNode === "score_lead" && idx < 3) ||
              (activeNode === "qualify_lead" && idx < 2) ||
              (activeNode === "enrich_lead" && idx < 1)

            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : isCompleted
                    ? "border-border bg-card"
                    : "border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="text-emerald-500 h-4 w-4" />
                    ) : isCurrent ? (
                      <Activity className="text-primary h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="text-muted-foreground h-4 w-4" />
                    )}
                    <span className="font-medium text-xs">{step.label}</span>
                  </div>
                  <div>
                    <Badge variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}>
                      {isCurrent ? "Active" : isCompleted ? "Done" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 ml-6">{step.desc}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
