'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Sparkles,
  Terminal,
  Copy,
  ChevronRight,
  Building,
  Calendar,
  Webhook,
  User,
  Shield,
  ArrowUpRight,
  Check,
  RefreshCw,
  WifiOff,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApi, mutateApi } from '@/lib/use-api';

/* ---------- Types ---------- */

interface TicketMessage {
  id: string;
  sender: string;
  role: 'system' | 'client' | 'agent';
  timestamp: string;
  content: string;
  isAlert?: boolean;
}

interface TicketListItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  client: string;
  reportedBy: string;
  reporterEmail: string;
  createdAt: string;
  timeAgo: string;
  status: 'open' | 'in_progress' | 'resolved' | 'requires_action';
  priority: 'high' | 'normal' | 'low' | 'urgent';
  category: 'Tech' | 'Billing' | 'Logistics' | 'Integration';
  assignee: string;
  slaRemaining: string;
  aiSummary: string;
  suggestedAction: string;
  conversationId: string;
  messages: TicketMessage[];
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  client: string;
  reportedBy: string;
  reporterEmail: string;
  createdAt: string;
  status: string;
  priority: string;
  assignee: string;
  slaRemaining: string;
  aiSummary: string;
  suggestedAction: string;
  escalationReason?: string;
  sentiment?: string;
  riskLevel?: string;
  messages: TicketMessage[];
  _fallback: boolean;
}

interface TicketsResponse {
  tickets: TicketListItem[];
  _fallback: boolean;
}

/* ---------- Skeleton ---------- */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

/* ---------- Component ---------- */

export default function TicketsPage() {
  const { data: ticketsData, loading: listLoading, isFallback, refetch: refetchList } = useApi<TicketsResponse>('/api/tickets');
  const tickets = ticketsData?.tickets || [];

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'internal'>('all');
  const [mutating, setMutating] = useState(false);

  // Create Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Tech' | 'Billing' | 'Logistics' | 'Integration'>('Tech');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newMessage, setNewMessage] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Auto-select first ticket when list loads
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0]!.id);
    }
  }, [tickets, selectedTicketId]);

  // Fetch detail for selected ticket
  const detailUrl = selectedTicketId ? `/api/tickets/${selectedTicketId}` : null;
  const { data: ticketDetail, loading: detailLoading, refetch: refetchDetail } = useApi<TicketDetail>(detailUrl);

  // Build effective selected ticket: detail if loaded, otherwise list entry
  const listEntry = tickets.find((t) => t.id === selectedTicketId);
  const selectedTicket = ticketDetail && !ticketDetail._fallback
    ? ticketDetail
    : listEntry || null;

  const displayMessages = ticketDetail?.messages || listEntry?.messages || [];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'requires_action'
        ? ticket.status === 'requires_action' || (ticket.status === 'open' && (ticket.priority === 'high' || ticket.priority === 'urgent'))
        : filterStatus === 'in_progress'
        ? ticket.status === 'in_progress'
        : ticket.status === 'resolved';

    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.client.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    // Optimistically add to display (the message is stored via Core API conversations)
    // For now, update the case summary with the reply note
    setMutating(true);
    await mutateApi(`/api/tickets/${selectedTicketId}`, {
      method: 'PATCH',
      body: { summary: `${selectedTicket?.aiSummary || ''}\n\nAgent note: ${replyText.trim()}` },
    });
    setMutating(false);
    setReplyText('');
    refetchDetail();
  };

  const handleCopySummary = () => {
    if (selectedTicket?.aiSummary) {
      navigator.clipboard.writeText(selectedTicket.aiSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicketId) return;
    setMutating(true);
    await mutateApi(`/api/tickets/${selectedTicketId}`, {
      method: 'PATCH',
      body: { priority: 'critical', status: 'open' },
    });
    setMutating(false);
    refetchList();
    refetchDetail();
  };

  const handleResolve = async () => {
    if (!selectedTicketId) return;
    setMutating(true);
    await mutateApi(`/api/tickets/${selectedTicketId}`, {
      method: 'PATCH',
      body: { status: 'resolved' },
    });
    setMutating(false);
    refetchList();
    refetchDetail();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      setCreateError('Please provide a subject for the ticket.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    const { data: created, error } = await mutateApi<{ id: string }>('/api/tickets', {
      method: 'POST',
      body: {
        customerId: 'CUST-1001',
        subject: `[${newCategory}] ${newSubject.trim()}`,
        summary: newMessage.trim() || newSubject.trim(),
        priority: newPriority,
        initialMessage: newMessage.trim() || undefined,
      },
    });

    setCreateSubmitting(false);

    if (error) {
      setCreateError(error);
      return;
    }

    // Reset form and close modal
    setNewSubject('');
    setNewMessage('');
    setIsCreateOpen(false);
    refetchList();

    if (created?.id) {
      setSelectedTicketId(created.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-background relative">
      {/* Left Panel: Ticket List */}
      <aside className="w-full md:w-[380px] lg:w-[420px] border-r border-white/10 bg-surface-container-lowest/60 flex flex-col h-full shrink-0 z-10">
        {/* List Header & Search */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-[17px] font-bold text-on-surface">Active Tickets</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold flex items-center gap-1 shadow-md shadow-primary/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="size-3.5" />
                <span>New Ticket</span>
              </button>
              <button
                onClick={refetchList}
                disabled={listLoading}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-white/5 transition-colors cursor-pointer"
                title="Refresh tickets"
              >
                <RefreshCw className={`size-3.5 ${listLoading ? 'animate-spin' : ''}`} />
              </button>
              <span className="font-label-mono text-xs bg-white/5 px-2 py-0.5 rounded text-outline border border-white/5">
                {filteredTickets.length} Total
              </span>
            </div>
          </div>

          {isFallback && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 rounded px-2 py-1 border border-amber-500/20">
              <WifiOff className="size-3" />
              <span>Core API offline — showing cached data</span>
            </div>
          )}

          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Filter by ID, client, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { key: 'all', label: 'All' },
              { key: 'requires_action', label: 'Requires Action', dotColor: 'bg-error' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'resolved', label: 'Resolved' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === f.key
                    ? f.key === 'requires_action'
                      ? 'bg-error/15 text-error font-semibold border border-error/30'
                      : f.key === 'in_progress'
                      ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                      : f.key === 'resolved'
                      ? 'bg-tertiary/15 text-tertiary font-semibold border border-tertiary/30'
                      : 'bg-white/15 text-on-surface font-semibold border border-white/15'
                    : 'bg-transparent text-outline hover:bg-white/5 border border-transparent'
                }`}
              >
                {f.label}
                {f.dotColor && <span className={`size-1.5 rounded-full ${f.dotColor}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {listLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-12 h-3" />
                </div>
                <Skeleton className="w-full h-5" />
                <Skeleton className="w-3/4 h-3" />
                <div className="flex gap-2">
                  <Skeleton className="w-14 h-5 rounded" />
                  <Skeleton className="w-14 h-5 rounded" />
                </div>
              </div>
            ))
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-outline">
              {tickets.length === 0
                ? 'No tickets found. Cases created via the AI Orchestrator will appear here.'
                : 'No tickets matching the filter criteria.'}
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicketId;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-s-2 border-s-primary shadow-sm'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-outline'}`}>
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-[11px] text-outline">{ticket.timeAgo}</span>
                  </div>

                  <h3 className={`text-sm font-semibold mb-1 leading-snug line-clamp-1 ${isSelected ? 'text-on-surface' : 'text-on-surface/90'}`}>
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-outline line-clamp-2 mb-3 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                          ticket.priority === 'urgent' || ticket.priority === 'high'
                            ? 'bg-error/15 border-error/30 text-error'
                            : 'bg-white/5 border-white/10 text-outline'
                        }`}
                      >
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] bg-secondary/15 border border-secondary/30 text-secondary">
                        {ticket.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-outline font-medium">{ticket.client}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Panel: Ticket Detail */}
      <section className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center text-outline text-sm">
            {listLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading tickets from Core API...</span>
              </div>
            ) : (
              'Select a ticket to view details'
            )}
          </div>
        ) : (
          <>
            {/* Breadcrumb & Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-outline">
                <span>Tickets</span>
                <ChevronRight className="size-3.5" />
                <span className="text-primary font-semibold font-mono">
                  {selectedTicket.ticketNumber || `#${selectedTicket.id.substring(0, 8).toUpperCase()}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEscalate}
                  disabled={mutating}
                  className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowUpRight className="size-3.5" /> Escalate
                </button>
                <button
                  onClick={handleResolve}
                  disabled={mutating}
                  className="px-3 py-1.5 rounded-lg border border-tertiary/30 bg-tertiary/10 hover:bg-tertiary/20 text-tertiary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="size-3.5" /> Resolve
                </button>
              </div>
            </div>

            {/* Bento Grid Detail Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1280px]">
              {/* Main Content Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Header Card */}
                <div className="glass-panel rounded-xl p-6 bg-surface-container-low border border-white/10 shadow-lg">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="font-headline-lg text-xl sm:text-2xl font-bold leading-tight text-on-surface">
                      {selectedTicket.title}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold whitespace-nowrap border ${
                        selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                          ? 'bg-tertiary/15 border-tertiary/30 text-tertiary'
                          : selectedTicket.status === 'requires_action' || selectedTicket.status === 'open'
                          ? 'bg-error/15 border-error/30 text-error'
                          : 'bg-primary/15 border-primary/30 text-primary'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                            ? 'bg-tertiary'
                            : selectedTicket.status === 'requires_action' || selectedTicket.status === 'open'
                            ? 'bg-error animate-ping'
                            : 'bg-primary animate-pulse'
                        }`}
                      />
                      {(selectedTicket.status || '').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Building className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-outline">Client Account</p>
                        <p className="text-xs font-semibold text-on-surface">{selectedTicket.client}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-outline shrink-0">
                        <User className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-outline">Reported By</p>
                        <p className="text-xs font-semibold text-on-surface">{selectedTicket.reportedBy}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-outline shrink-0">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-outline">Created</p>
                        <p className="text-xs font-semibold text-on-surface">
                          {new Date(selectedTicket.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Summary Card */}
                <div className="glass-panel rounded-xl p-[1px] bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/40 ai-glow relative overflow-hidden">
                  <div className="bg-surface-container-low rounded-[11px] p-5 h-full relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary animate-pulse" />
                        <h3 className="font-label-mono text-xs text-primary uppercase tracking-wider font-bold">
                          AI Diagnostic & Log Summary
                        </h3>
                      </div>
                      {detailLoading && <Loader2 className="size-3.5 text-primary animate-spin" />}
                      <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary font-mono">
                        {ticketDetail?.escalationReason ? `Escalated: ${ticketDetail.escalationReason}` : 'LangGraph Evaluated'}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed text-on-surface-variant mb-4 font-mono">
                      {selectedTicket.aiSummary || 'No AI diagnostic summary available.'}
                    </p>

                    {ticketDetail?.sentiment && (
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Sentiment: {ticketDetail.sentiment}
                        </Badge>
                        {ticketDetail.riskLevel && (
                          <Badge variant="outline" className={`text-[10px] font-mono ${
                            ticketDetail.riskLevel === 'high' ? 'border-error/30 text-error' : ''
                          }`}>
                            Risk: {ticketDetail.riskLevel}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopySummary}
                        className="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Summary'}</span>
                      </button>
                      {selectedTicket.suggestedAction && (
                        <button
                          onClick={() => alert(`Recommended Action:\n\n${selectedTicket.suggestedAction}`)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant text-xs font-medium hover:bg-white/10 hover:text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Terminal className="size-3.5" />
                          <span>View Recommended Action</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Communication Thread */}
                <div className="glass-panel rounded-xl flex flex-col bg-surface-container-low border border-white/10 shadow-lg min-h-[420px]">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-sm font-semibold text-on-surface">Activity & Communication</h3>
                    <div className="flex gap-1 bg-surface-container-lowest rounded-lg p-1 border border-white/10 text-xs">
                      <button
                        onClick={() => setActiveTabFilter('all')}
                        className={`px-3 py-0.5 rounded transition-colors cursor-pointer ${
                          activeTabFilter === 'all' ? 'bg-white/15 text-on-surface font-semibold' : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        All Messages
                      </button>
                      <button
                        onClick={() => setActiveTabFilter('internal')}
                        className={`px-3 py-0.5 rounded transition-colors cursor-pointer ${
                          activeTabFilter === 'internal' ? 'bg-white/15 text-on-surface font-semibold' : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        System Alerts
                      </button>
                    </div>
                  </div>

                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[360px]">
                    {detailLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="size-8 rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="w-1/3 h-3" />
                            <Skeleton className="w-full h-16 rounded-lg" />
                          </div>
                        </div>
                      ))
                    ) : displayMessages.length === 0 ? (
                      <div className="text-center text-xs text-outline py-8">
                        No messages yet. Start a conversation by sending a reply below.
                      </div>
                    ) : (
                      displayMessages
                        .filter((msg) => (activeTabFilter === 'internal' ? msg.role === 'system' : true))
                        .map((msg) => {
                          if (msg.role === 'system') {
                            return (
                              <div key={msg.id} className="flex gap-3">
                                <div className="size-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center shrink-0 text-error">
                                  <Webhook className="size-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-semibold text-on-surface">{msg.sender}</span>
                                    <span className="text-[10px] text-outline font-mono">{msg.timestamp}</span>
                                  </div>
                                  <div className="bg-surface-container-lowest border border-white/10 rounded-lg p-3 font-mono text-xs text-error/90 leading-relaxed">
                                    {msg.content}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const isClient = msg.role === 'client';
                          return (
                            <div key={msg.id} className="flex gap-3">
                              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-[10px] text-on-primary shrink-0">
                                {msg.sender.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-xs font-semibold text-on-surface">
                                    {msg.sender} <span className="text-outline font-normal">({isClient ? 'Client' : 'Agent'})</span>
                                  </span>
                                  <span className="text-[10px] text-outline font-mono">{msg.timestamp}</span>
                                </div>
                                <div className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                                  isClient
                                    ? 'bg-surface-container border-white/10 text-on-surface rounded-tl-none'
                                    : 'bg-primary/10 border-primary/20 text-on-surface rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="p-4 border-t border-white/10 bg-surface-container-lowest/50">
                    <div className="bg-surface-container rounded-lg border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all p-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${selectedTicket.reportedBy || 'customer'}...`}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface resize-none p-1 placeholder:text-outline outline-none"
                      />
                      <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                        <span className="text-[10px] font-mono text-outline">Updates via Core API v1</span>
                        <Button
                          type="submit"
                          disabled={!replyText.trim() || mutating}
                          className="px-4 py-1.5 bg-gradient-to-r from-primary to-inverse-primary text-white text-xs font-semibold rounded-lg shadow-md hover:opacity-90 disabled:opacity-40 cursor-pointer h-7 flex items-center gap-1.5"
                        >
                          {mutating ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                          <span>{mutating ? 'Sending...' : 'Send Reply'}</span>
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Sidebar Column */}
              <div className="space-y-6">
                {/* Properties Card */}
                <div className="glass-panel rounded-xl p-5 bg-surface-container-low border border-white/10 shadow-lg space-y-4">
                  <h3 className="font-label-mono text-xs uppercase text-outline tracking-wider font-bold border-b border-white/5 pb-3">
                    Ticket Properties
                  </h3>

                  <div>
                    <label className="text-[11px] text-outline block mb-1 font-medium">Assignee</label>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                          {selectedTicket.assignee === 'Unassigned' ? '?' : 'AI'}
                        </div>
                        <span className="text-xs font-semibold text-on-surface">{selectedTicket.assignee}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-outline block mb-1 font-medium">Priority</label>
                    <div className="p-2 rounded-lg bg-surface-container border border-white/5 flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase font-mono ${
                        selectedTicket.priority === 'urgent' || selectedTicket.priority === 'high' || selectedTicket.priority === 'critical'
                          ? 'text-error'
                          : 'text-tertiary'
                      }`}>
                        {selectedTicket.priority}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-white/10">
                        SLA: {selectedTicket.slaRemaining}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-outline block mb-1 font-medium">Contact Email</label>
                    <div className="p-2 rounded-lg bg-surface-container border border-white/5 text-xs font-mono text-primary truncate">
                      {selectedTicket.reporterEmail || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-outline block mb-1 font-medium">Case ID</label>
                    <div className="p-2 rounded-lg bg-surface-container border border-white/5 text-xs font-mono text-outline truncate">
                      {selectedTicket.id}
                    </div>
                  </div>
                </div>

                {/* SLA Governance */}
                <div className="glass-panel rounded-xl p-5 bg-surface-container-low border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="size-4 text-tertiary" />
                    <h4 className="text-xs font-bold text-on-surface">Automated Governance SLA</h4>
                  </div>
                  <p className="text-xs text-outline leading-relaxed mb-4">
                    Governed under <strong>LangGraph Orchestration</strong> with guaranteed diagnostic response.
                  </p>
                  <div className="p-3 rounded-lg bg-surface-container-lowest border border-white/5 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-outline">Status:</span>
                      <span className={`font-mono font-bold ${
                        selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'text-emerald-400' : 'text-primary'
                      }`}>
                        {(selectedTicket.status || 'unknown').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-outline">Priority Level:</span>
                      <span className="text-primary font-mono font-bold">{selectedTicket.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-lg bg-surface-container-low border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-surface-container-lowest/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Plus className="size-4" />
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Create New Support Ticket</h3>
                  <p className="text-xs text-outline">Open a case for human representative or AI copilot</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-xs text-error">
                  {createError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">
                  Subject / Summary <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken packaging for Order ORD-1002"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-3.5 py-2 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'Tech' | 'Billing' | 'Logistics' | 'Integration')}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="Tech">Technical Support</option>
                    <option value="Billing">Billing & Invoices</option>
                    <option value="Logistics">Logistics & Delivery</option>
                    <option value="Integration">API & Webhooks</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="low">Low (Standard SLA)</option>
                    <option value="medium">Medium (24h SLA)</option>
                    <option value="high">High (4h SLA)</option>
                    <option value="urgent">Urgent (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1.5">Initial Message / Notes</label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed context, order numbers, or error details..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl p-3 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-outline hover:text-on-surface hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Create Ticket</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
