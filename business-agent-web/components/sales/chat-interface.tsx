"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Server,
  Activity,
  Layers,
} from "lucide-react"

import { ChatMessageItem } from "@/lib/sales-types"

interface ChatInterfaceProps {
  messages: ChatMessageItem[]
  isRunning: boolean
  activeMode: "websocket" | "rest"
  onModeChange: (mode: "websocket" | "rest") => void
  onSendMessage: (prompt: string) => void
  onReset: () => void
  activeNode?: string
}

const QUICK_ACTIONS = [
  "Qualify lead alex@acmecorp.com",
  "What is our enterprise pricing and objection handling?",
  "Draft an executive outreach email for TechFlow",
  "Enrich company profile for startupxyz.dev",
]

export function ChatInterface({
  messages,
  isRunning,
  activeMode,
  onModeChange,
  onSendMessage,
  onReset,
  activeNode,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  // Auto scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isRunning])

  const handleSend = () => {
    if (!inputValue.trim() || isRunning) return
    onSendMessage(inputValue)
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card className="flex flex-col h-[750px]">
      {/* Header */}
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">AI Sales Assistant</CardTitle>
                <Badge variant="outline">Parallel LangGraph</Badge>
              </div>
              <CardDescription className="text-xs">
                Concurrent CRM + Enrichment + BANT Playbook Evaluation
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <Separator orientation="vertical" className="h-6" />
            <div>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Live Parallel Execution Progress Banner */}
        {isRunning && (
          <div className="mt-2 flex items-center justify-between rounded-md border bg-primary/5 p-2 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium text-foreground">
                Executing Parallel Branches: CRM || Enrichment || Playbook...
              </span>
            </div>
            <Badge variant="default">
              {activeNode ? activeNode.replace(/_/g, " ").toUpperCase() : "FANNING OUT"}
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* Message Feed */}
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-[480px] pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user"

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex flex-col max-w-[80%] gap-1.5 ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {isUser ? "You" : "Sales Assistant"}
                      </span>
                      {msg.intent && (
                        <Badge variant="outline" className="text-[10px]">
                          {msg.intent.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <div
                      className={`p-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted/50 border rounded-tl-none text-foreground"
                      }`}
                    >
                      {msg.content}

                      {/* Inline Structured Output Cards */}
                      {msg.resultSnapshot && (
                        <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-border/40">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                msg.resultSnapshot.status === "qualified"
                                  ? "default"
                                  : msg.resultSnapshot.status === "nurture"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              Score: {msg.resultSnapshot.score}/100 ({msg.resultSnapshot.status.toUpperCase()})
                            </Badge>

                            {msg.resultSnapshot.enriched_data?.tech_stack && (
                              <Badge variant="outline">
                                Stack: {msg.resultSnapshot.enriched_data.tech_stack.slice(0, 3).join(", ")}
                              </Badge>
                            )}

                            {msg.resultSnapshot.outreach_plan?.full_email_body && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  handleCopy(msg.id, msg.resultSnapshot?.outreach_plan?.full_email_body || "")
                                }
                              >
                                {copiedId === msg.id ? <Check /> : <Copy />}
                                {copiedId === msg.id ? "Copied" : "Copy Email"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-muted-foreground/70">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Thinking / Running Indicator */}
            {isRunning && (
              <div className="flex gap-3">
                <Avatar size="sm">
                  <AvatarFallback>
                    <Sparkles className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-xl border bg-muted/40 text-xs text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 animate-pulse text-primary" />
                  <span>Synthesizing parallel CRM, enrichment, and playbook branches...</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Suggested Prompts & Input Area */}
      <CardFooter className="flex flex-col gap-2.5 border-t pt-3">
        {/* Quick action chips */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-muted-foreground shrink-0 font-medium mr-1">
            Suggested:
          </span>
          {QUICK_ACTIONS.map((action, i) => (
            <div key={i} className="shrink-0">
              <Button
                variant="outline"
                size="xs"
                isDisabled={isRunning}
                onClick={() => onSendMessage(action)}
              >
                {action}
              </Button>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="w-full flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g. 'Qualify alex@acmecorp.com', 'What is our enterprise pricing?')..."
            />
          </div>
          <div>
            <Button
              variant="default"
              size="default"
              isDisabled={isRunning || !inputValue.trim()}
              onClick={handleSend}
            >
              <Send />
              Send
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
