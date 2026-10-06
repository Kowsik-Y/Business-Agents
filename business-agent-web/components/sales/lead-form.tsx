"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Zap, Server } from "lucide-react"

import { LeadInput } from "@/lib/sales-types"

interface LeadFormProps {
  lead: LeadInput
  onChange: (updated: LeadInput) => void
  presets: Array<{ label: string; lead: LeadInput }>
  activeMode: "websocket" | "rest"
  onModeChange: (mode: "websocket" | "rest") => void
  isRunning: boolean
  onExecute: () => void
}

export function LeadForm({
  lead,
  onChange,
  presets,
  activeMode,
  onModeChange,
  isRunning,
  onExecute,
}: LeadFormProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick Presets */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Inbound Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <div key={idx}>
              <Button
                variant={lead.email === p.lead.email ? "default" : "outline"}
                size="sm"
                onClick={() => onChange(p.lead)}
              >
                {p.label}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Inbound Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inbound Lead Setup</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant={activeMode === "websocket" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("websocket")}
              >
                <Zap />
                WebSocket
              </Button>
              <Button
                variant={activeMode === "rest" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("rest")}
              >
                <Server />
                REST
              </Button>
            </div>
          </div>
          <CardDescription>
            Enter prospective client details or choose a preset above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-email">Email Address</Label>
                <Input
                  id="lead-email"
                  value={lead.email}
                  onChange={(e) => onChange({ ...lead, email: e.target.value })}
                  placeholder="alex@acmecorp.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-name">Contact Name</Label>
                <Input
                  id="lead-name"
                  value={lead.name || ""}
                  onChange={(e) => onChange({ ...lead, name: e.target.value })}
                  placeholder="Alex Mercer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-company">Company</Label>
                <Input
                  id="lead-company"
                  value={lead.company || ""}
                  onChange={(e) => onChange({ ...lead, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-budget">Budget ($ USD)</Label>
                <Input
                  id="lead-budget"
                  type="number"
                  value={lead.estimated_budget || 0}
                  onChange={(e) =>
                    onChange({ ...lead, estimated_budget: Number(e.target.value) })
                  }
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-timeline">Timeline (Months)</Label>
                <Input
                  id="lead-timeline"
                  type="number"
                  value={lead.timeline_months || 3}
                  onChange={(e) =>
                    onChange({ ...lead, timeline_months: Number(e.target.value) })
                  }
                  placeholder="2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-authority">Decision Authority</Label>
                <div className="flex items-center h-9">
                  <Badge
                    variant={lead.has_decision_authority ? "default" : "secondary"}
                  >
                    {lead.has_decision_authority ? "Verified Sponsor" : "User / Dev"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-notes">Context / Problem Statement</Label>
              <Textarea
                id="lead-notes"
                rows={3}
                value={lead.notes || ""}
                onChange={(e) => onChange({ ...lead, notes: e.target.value })}
                placeholder="Describe primary business pain point..."
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <Button
              variant="default"
              size="lg"
              isDisabled={isRunning}
              onClick={onExecute}
            >
              <Play />
              {isRunning ? "Running LangGraph State Machine..." : "Run AI Sales Assistant"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
