"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { SalesAssistantResult } from "@/lib/sales-types"

interface AccountIntelligenceProps {
  enrichedData?: SalesAssistantResult["enriched_data"]
}

export function AccountIntelligence({ enrichedData }: AccountIntelligenceProps) {
  if (!enrichedData) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enriched Account Intelligence</CardTitle>
        <CardDescription>
          Data aggregated from CRM records & domain enrichment tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-md border bg-muted/20">
              <div className="text-xs text-muted-foreground">ARR</div>
              <div className="font-semibold text-sm mt-0.5">
                {enrichedData.estimated_arr || "$25M"}
              </div>
            </div>
            <div className="p-3 rounded-md border bg-muted/20">
              <div className="text-xs text-muted-foreground">Headcount</div>
              <div className="font-semibold text-sm mt-0.5">
                {enrichedData.headcount || 220} Employees
              </div>
            </div>
            <div className="p-3 rounded-md border bg-muted/20">
              <div className="text-xs text-muted-foreground">Funding</div>
              <div className="font-semibold text-sm mt-0.5">
                {enrichedData.funding_stage || "Series B"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Detected Tech Stack
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                enrichedData.tech_stack || [
                  "React",
                  "FastAPI",
                  "PostgreSQL",
                  "AWS",
                  "Kubernetes",
                ]
              ).map((tech, i) => (
                <Badge key={i} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
