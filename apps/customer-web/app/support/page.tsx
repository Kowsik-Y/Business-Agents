'use client';

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Lock,
  User,
  Send,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCustomer } from '../components/CustomerContext';
import HumanRepresentativeCard from '../components/HumanRepresentativeCard';
import VoiceModal from '../components/VoiceModal';
import Link from 'next/link';

interface SupportMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function HumanSupportPage() {
  const { activeProfile, setIsAuthOpen } = useCustomer();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Poll conversation messages
  const fetchMessages = async () => {
    try {
      const convId = localStorage.getItem('csp_conversation_id') || 'conv_etd5vyhr';
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setSending(true);
    const convId = localStorage.getItem('csp_conversation_id') || 'conv_etd5vyhr';
    try {
      await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMsg,
          conversationId: convId,
          customerId: activeProfile.id,
        }),
      });
      setInputMsg('');
      await fetchMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Headphones className="size-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Human Support Representative Room
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                Live Representative Online
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Direct Level-2 / Level-3 human escalation desk with Four-Eyes Policy verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsVoiceOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="size-4" />
              <span>Voice Call Agent</span>
            </Button>

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
            >
              <span>Agent Console (Port 3001)</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Large Prominent Human Representative Card */}
        <HumanRepresentativeCard
          representativeName="Marcus Vance"
          representativeRole="Senior Support Desk Lead & HITL Supervisor"
          orderId={activeProfile?.activeOrder || 'ORD-1001'}
          orderStatus="Cancelled & Refunded"
          policyLevel="Tier 1 VIP Four-Eyes Verified"
          onStartVoiceCall={() => setIsVoiceOpen(true)}
        />

        {/* Real-time Interaction Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Live Conversation Panel */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col h-[500px] shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Live Escalated Conversation Stream</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMessages}
                className="text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw className="size-3 mr-1" /> Refresh
              </Button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Headphones className="size-8 text-slate-600 animate-pulse" />
                  <span>No messages in this escalation yet. Speak to Marcus Vance below.</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isAgent = m.role === 'agent' || m.role === 'support' || m.role === 'assistant';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
                    >
                      <div
                        className={`size-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAgent
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {isAgent ? 'MV' : 'You'}
                      </div>
                      <div className={`max-w-[80%] flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-300">
                            {isAgent ? 'Marcus Vance (Support Specialist)' : activeProfile.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isAgent
                              ? 'bg-slate-800 text-slate-200 border border-purple-500/20'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Type a message to Support Specialist Marcus Vance..."
                className="flex-1 bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <Button
                type="submit"
                disabled={sending || !inputMsg.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl px-4 font-semibold cursor-pointer"
              >
                <Send className="size-3.5 mr-1" />
                <span>Send</span>
              </Button>
            </form>
          </div>

          {/* Right Column: Governance Details & Telemetry */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-white/10">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Four-Eyes Compliance Record</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Authorized Approver:</span>
                  <span className="font-semibold text-white">Marcus Vance (Senior Support Lead)</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Policy Trigger:</span>
                  <span className="font-mono text-purple-300">ORD-1001 Order Cancellation & Refund</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Ledger Sync Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3.5" /> Core API & ERP Synchronized
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Audit Hash Signature:</span>
                  <span className="font-mono text-[10px] text-slate-500 break-all">
                    sha256:4f8e9a2b7c1d3e5f608192a4c6e8f0a2
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <Link
                  href="/tickets"
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <span>Open Full Tickets & Cases</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Call Telephony Modal */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
}
