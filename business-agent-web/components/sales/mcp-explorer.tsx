"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

import { SalesAssistantResult } from "@/lib/sales-types"

interface McpExplorerProps {
  result: SalesAssistantResult | null
}

export function McpExplorer({ result }: McpExplorerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Architecture & Protocol Explorer</CardTitle>
        <CardDescription>
          Inspect LangGraph checkpoint memory and Model Context Protocol resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultSelectedKey="mcp">
          <TabsList>
            <TabsTrigger id="mcp">Model Context Protocol (MCP)</TabsTrigger>
            <TabsTrigger id="state">LangGraph Checkpoint</TabsTrigger>
          </TabsList>

          <TabsContent id="mcp">
            <div className="flex flex-col gap-3 pt-2 text-xs">
              <div className="p-3 rounded-md border bg-muted/20">
                <div className="font-semibold text-foreground">Exposed MCP Tools</div>
                <div className="text-muted-foreground mt-1">
                  <code>crm_lookup_lead</code>, <code>enrich_company_profile</code>,{" "}
                  <code>calculate_lead_score</code>, <code>run_sales_assistant</code>
                </div>
              </div>
              <div className="p-3 rounded-md border bg-muted/20">
                <div className="font-semibold text-foreground">Exposed MCP Resources</div>
                <div className="text-muted-foreground mt-1">
                  <code>business://sales/playbook</code>,{" "}
                  <code>business://sales/pricing-tiers</code>,{" "}
                  <code>business://sales/objection-handling</code>
                </div>
              </div>
              <div className="p-3 rounded-md border bg-muted/20">
                <div className="font-semibold text-foreground">Exposed MCP Prompts</div>
                <div className="text-muted-foreground mt-1">
                  <code>qualify-sales-lead</code>, <code>draft-sales-outreach</code>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent id="state">
            <ScrollArea className="h-40 rounded-md border bg-muted/40 p-3 font-mono text-xs">
              <pre>
                {result
                  ? JSON.stringify(result, null, 2)
                  : "// Checkpoint state is empty. Run a lead to populate."}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
