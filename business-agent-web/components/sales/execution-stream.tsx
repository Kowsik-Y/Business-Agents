"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ExecutionStreamProps {
  auditLogs: string[]
  isLive?: boolean
}

export function ExecutionStream({ auditLogs, isLive = true }: ExecutionStreamProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Execution Stream</CardTitle>
          <Badge variant="outline">{isLive ? "Live" : "Idle"}</Badge>
        </div>
        <CardDescription>Real-time event stream from WebSocket / LangGraph</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-44 rounded-md border bg-muted/40 p-3 font-mono text-xs">
          {auditLogs.length === 0 ? (
            <div className="text-muted-foreground italic">
              Ready. Click &apos;Run&apos; to begin streaming.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {auditLogs.map((log, i) => (
                <div key={i} className="leading-tight text-foreground/80">
                  {log}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
