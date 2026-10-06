"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Copy, Check, CheckCircle2, Sparkles } from "lucide-react"

import { OutreachPlan } from "@/lib/sales-types"

interface OutreachDraftProps {
  outreachPlan?: OutreachPlan
}

export function OutreachDraft({ outreachPlan }: OutreachDraftProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (outreachPlan?.full_email_body) {
      navigator.clipboard.writeText(outreachPlan.full_email_body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personalized Sales Outreach</CardTitle>
            <CardDescription>
              Tailored executive outreach crafted by the outreach generation node
            </CardDescription>
          </div>
          {outreachPlan && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy Email"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {outreachPlan ? (
          <div className="flex flex-col gap-4">
            {outreachPlan.subject_line && (
              <div className="p-3 rounded-md border bg-muted/40">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Subject Line:
                </span>
                <div className="text-sm font-semibold mt-1">
                  {outreachPlan.subject_line}
                </div>
              </div>
            )}

            <div className="p-4 rounded-md border bg-card font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {outreachPlan.full_email_body}
            </div>

            {outreachPlan.call_to_action && (
              <div className="flex items-center gap-2 p-3 rounded-md border bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Call To Action:</strong> {outreachPlan.call_to_action}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-2 opacity-40" />
            <div className="text-sm font-medium">Outreach draft will appear here</div>
            <div className="text-xs mt-1">
              Qualified leads automatically trigger a tailored executive outreach draft.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
