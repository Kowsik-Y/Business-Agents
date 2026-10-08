'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, User, RefreshCw, Sparkles, Package, Truck, CheckCircle2, Headphones, Mic, ArrowUpRight, ShieldAlert } from 'lucide-react';
import VoiceModal from './VoiceModal';
import HumanRepresentativeCard from './HumanRepresentativeCard';
import type { CustomerProfile } from './CustomerAuthModal';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolStatus?: string;
  isStreaming?: boolean;
}

type ChatState = 'idle' | 'sending' | 'receiving' | 'completed' | 'escalated';

interface ChatWindowProps {
  activeProfile?: CustomerProfile;
  onOpenAuth?: () => void;
}

export default function ChatWindow({ activeProfile, onOpenAuth: _onOpenAuth }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello ${activeProfile?.name || 'there'}! I am your AI Customer Success Assistant. How can I help you today? You can ask about order status, tracking, or general support.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or restore conversation ID
  useEffect(() => {
    const savedConvId = localStorage.getItem('csp_conversation_id');
    if (savedConvId) {
      setConversationId(savedConvId);
    } else {
      const newId = `conv_${Math.random().toString(36).substring(2, 10)}`;
      setConversationId(newId);
      localStorage.setItem('csp_conversation_id', newId);
    }
  }, []);

  // Auto-scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatState]);

  // Real-time WebSocket connection for agent messages
  useEffect(() => {
    if (!conversationId) return;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_CORE_WS_URL || 'ws://localhost:8000/ws';
      ws = new WebSocket(`${wsUrl}?conversationId=${conversationId}&role=customer`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message.created' && data.message) {
            const sMsg = data.message;
            if (sMsg.role === 'agent' || sMsg.role === 'support') {
              setMessages((prev) => {
                if (prev.some((m) => m.content === sMsg.content || m.id === sMsg.id)) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    id: sMsg.id || `agent_${Date.now()}`,
                    role: 'assistant',
                    content: sMsg.content,
                    timestamp: new Date(sMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    toolStatus: 'Support Specialist Marcus Vance (Live)',
                  },
                ];
              });
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWebSocket, 2000); // Reconnect on close
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [conversationId]);

  const handleStartNewConversation = () => {
    const newId = `conv_${Math.random().toString(36).substring(2, 10)}`;
    setConversationId(newId);
    localStorage.setItem('csp_conversation_id', newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'New session started. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatState('idle');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || chatState === 'sending' || chatState === 'receiving') {
      return;
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInput('');
    setChatState('sending');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationId || `conv_default`,
          message: messageContent,
          customerId: activeProfile?.id || 'CUST-ANON',
          authenticationLevel: activeProfile?.authLevel ?? 0,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start chat stream');
      }

      setChatState('receiving');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let activeTool = '';
      let escalationHandled = false;

      const triggerEscalationTicket = (summaryText?: string) => {
        if (escalationHandled) return;
        escalationHandled = true;

        // Search in reverse across full conversation history + current turn for the active order ID
        const allHistoryText = [
          ...messages.map((m) => m.content),
          messageContent,
          summaryText || '',
          accumulatedText,
        ].reverse().join(' ');

        const orderMatch = allHistoryText.match(/ORD-?\d+/i);
        const orderId = orderMatch
          ? orderMatch[0].toUpperCase().startsWith('ORD-')
            ? orderMatch[0].toUpperCase()
            : `ORD-${orderMatch[0].toUpperCase().replace('ORD', '')}`
          : 'ORD-1003';

        const historyPayload = [
          ...messages.filter((m) => m.id !== 'welcome-msg').map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: messageContent },
        ];

        fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: activeProfile?.id || 'CUST-1001',
            subject: `[Live Escalation] ${messageContent.toUpperCase().includes('ORD-') ? messageContent : `${messageContent} (${orderId})`}`,
            summary: summaryText || accumulatedText || `Customer requested sensitive order action for ${orderId} requiring Four-Eyes verification.`,
            priority: 'high',
            conversationId: conversationId || `conv_default`,
            initialMessage: messageContent,
            orderId,
            conversationHistory: historyPayload,
          }),
        }).catch(() => {});
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.startsWith('data:')) {
            try {
              const rawData = line.replace('data:', '').trim();
              if (!rawData) continue;
              const eventData = JSON.parse(rawData);

              if (eventData.type === 'tool.proposed') {
                activeTool = `Checking ${eventData.tool.replace(/_/g, ' ')}...`;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, toolStatus: activeTool }
                      : msg
                  )
                );
              } else if (eventData.type === 'tool.completed') {
                activeTool = '';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, toolStatus: undefined }
                      : msg
                  )
                );
              } else if (eventData.type === 'text.delta') {
                accumulatedText += eventData.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );

                // Detect handoff statements in real-time stream
                if (
                  !escalationHandled &&
                  (accumulatedText.includes('Transferring to Human Support') ||
                    accumulatedText.includes('Four-Eyes policy') ||
                    accumulatedText.includes('human support specialist') ||
                    accumulatedText.includes('Agent Command Center'))
                ) {
                  setChatState('escalated');
                  triggerEscalationTicket(eventData.content);
                }
              } else if (eventData.type === 'handoff.required' || eventData.type === 'handoff_required') {
                setChatState('escalated');
                activeTool = 'Transferring to Human Support Representative...';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, toolStatus: 'Transferring to Human Support Representative...' }
                      : msg
                  )
                );

                triggerEscalationTicket(eventData.summary);
              } else if (eventData.type === 'turn.completed') {
                setChatState('completed');
              }
            } catch {
              // Ignore non-JSON chunks
            }
          }
        }
      }

      // Check if end of stream reached handoff condition
      if (
        !escalationHandled &&
        (accumulatedText.toLowerCase().includes('transferring') ||
          accumulatedText.toLowerCase().includes('four-eyes') ||
          accumulatedText.toLowerCase().includes('human representative'))
      ) {
        triggerEscalationTicket();
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
      setChatState('idle');
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, I encountered an issue connecting to the AI Orchestrator service. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
      setChatState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full bg-[#0f172a]/90 border-white/10 text-slate-100 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Header using CardHeader */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 px-6 py-4 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Virtual Concierge
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Real-time LangGraph & Core API Integration
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/support"
            className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Headphones className="w-3.5 h-3.5 text-purple-400" />
            <span>Human Support Room</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVoiceOpen(true)}
            className="bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:text-white transition-all cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            <span>Voice Call</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartNewConversation}
            className="bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>New Chat</span>
          </Button>
        </div>
      </CardHeader>

      {/* Messages Scroll Area */}
      <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="size-8 shrink-0 shadow-md">
                    <AvatarFallback
                      className={
                        isUser
                          ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-xs font-bold'
                          : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white text-xs font-bold'
                      }
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {message.toolStatus && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono animate-pulse gap-1 py-0.5"
                      >
                        <Package className="w-3 h-3 animate-spin" />
                        <span>{message.toolStatus}</span>
                      </Badge>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-xs'
                      }`}
                    >
                      {message.content}
                      {message.isStreaming && !message.content && (
                        <div className="flex items-center gap-1 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono px-1" suppressHydrationWarning>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Large Interactive Human Support Representative Card */}
            {chatState === 'escalated' && (
              <HumanRepresentativeCard
                representativeName="Marcus Vance"
                representativeRole="Senior Escalations Desk Lead & HITL Supervisor"
                orderId={activeProfile?.activeOrder || 'ORD-1001'}
                orderStatus="Cancelled & Refunded"
                policyLevel="Level 3 Four-Eyes Compliance"
                onStartVoiceCall={() => setIsVoiceOpen(true)}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Suggestion Badges */}
        <div className="px-6 py-2 border-t border-white/5 bg-slate-950/40 flex flex-wrap gap-2">
          <Badge
            variant="outline"
            onClick={() => handleSendMessage(`Where is my order ${activeProfile?.activeOrder || 'ORD-1001'}?`)}
            className="cursor-pointer bg-slate-900/80 hover:bg-indigo-950/50 border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-[11px] py-1 gap-1 transition-all"
          >
            <Truck className="w-3 h-3 text-indigo-400" />
            Track Order {activeProfile?.activeOrder || 'ORD-1001'}
          </Badge>
          <Badge
            variant="outline"
            onClick={() => handleSendMessage(`What are my benefits as a ${activeProfile?.tier || 'Member'}?`)}
            className="cursor-pointer bg-slate-900/80 hover:bg-indigo-950/50 border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-[11px] py-1 gap-1 transition-all"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Check {activeProfile?.tier || 'Member'} Benefits
          </Badge>
          <Badge
            variant="outline"
            onClick={() => handleSendMessage('Track order ORD-1002')}
            className="cursor-pointer bg-slate-900/80 hover:bg-indigo-950/50 border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-[11px] py-1 gap-1 transition-all"
          >
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            Status ORD-1002 (Delivered)
          </Badge>
          <Badge
            variant="outline"
            onClick={() => handleSendMessage('I want to speak with a human agent')}
            className="cursor-pointer bg-slate-900/80 hover:bg-indigo-950/50 border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-[11px] py-1 gap-1 transition-all"
          >
            <Headphones className="w-3 h-3 text-purple-400" />
            Live Agent Escalation
          </Badge>
        </div>
      </CardContent>

      {/* Footer Input Area */}
      <CardFooter className="border-t border-white/10 p-4 bg-slate-950/60">
        <form
          className="flex items-center gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question (e.g., 'Track order ORD-1001')..."
            className="flex-1 bg-slate-900/90 border-white/15 focus-visible:ring-indigo-500 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl"
          />
          <Button
            type="submit"
            disabled={!input.trim() || chatState === 'sending' || chatState === 'receiving'}
            size="icon"
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 w-10 shrink-0 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardFooter>

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        conversationId={conversationId}
      />
    </Card>
  );
}
