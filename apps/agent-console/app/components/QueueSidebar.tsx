'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  Search,
  Flame,
  Clock,
  UserCheck,
  Filter,
  RefreshCw,
} from 'lucide-react';

export interface CaseItem {
  id: string;
  conversationId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_approval' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  subject: string;
  summary?: string;
  assignedAgentId?: string | null;
  escalation?: {
    reason?: string;
    sentiment?: string;
    riskLevel?: string;
    summary?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface QueueSidebarProps {
  cases: CaseItem[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  currentAgentId?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  isPolling?: boolean;
}

export function QueueSidebar({
  cases,
  selectedCaseId,
  onSelectCase,
  currentAgentId = 'agent-me',
  isLoading = false,
  onRefresh,
  isPolling = true,
}: QueueSidebarProps) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = cases.filter((c) => {
    // Filter tabs
    if (filter === 'mine' && c.assignedAgentId !== currentAgentId) return false;
    if (filter === 'unassigned' && c.assignedAgentId) return false;
    if (filter === 'urgent' && c.priority !== 'urgent') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.customerName || '').toLowerCase().includes(q);
      const matchSubject = (c.subject || '').toLowerCase().includes(q);
      const matchSummary = (c.summary || '').toLowerCase().includes(q);
      return matchName || matchSubject || matchSummary;
    }

    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full">
            Low
          </span>
        );
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    const defaultEntry = { label: 'Neutral', color: 'text-slate-400 bg-slate-800/40 border-slate-700/40' };
    const map: Record<string, { label: string; color: string }> = {
      frustrated: { label: 'Frustrated', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' },
      angry: { label: 'Angry', color: 'text-red-400 bg-red-950/40 border-red-800/40' },
      neutral: defaultEntry,
      positive: { label: 'Positive', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
    };
    const s = map[sentiment.toLowerCase()] ?? defaultEntry;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const formatElapsed = (dateStr: string) => {
    try {
      const elapsedMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(elapsedMs / (60 * 1000));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      return `${hours}h ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 h-full flex flex-col border-r border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200">
              Escalation Queue
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-medium rounded-full border border-indigo-500/30">
              {filteredCases.length} Active
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search queue, customer, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/90 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs">
          {(['all', 'mine', 'unassigned', 'urgent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 rounded-md capitalize font-semibold transition-all text-[11px] text-center cursor-pointer ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Case List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1.5">
        {isLoading && cases.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-white/5 animate-pulse space-y-2">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-300">No active cases in queue</p>
            <p className="text-[11px] text-slate-500 mt-1">
              New customer handoffs and AI escalations will appear live.
            </p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const isSelected = c.id === selectedCaseId;
            const isAssignedToMe = c.assignedAgentId === currentAgentId;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`p-3 rounded-xl cursor-pointer border transition-all relative ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/60 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40 hover:border-white/10'
                }`}
              >
                {/* Top Row: Customer & Priority */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {c.customerName || 'Customer'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.customerEmail || c.customerId || 'Customer Session'}
                    </p>
                  </div>
                  {getPriorityBadge(c.priority)}
                </div>

                {/* Subject & Summary */}
                <p className="text-xs text-slate-300 font-medium line-clamp-1 mb-1.5">
                  {c.subject || 'Support Escalation'}
                </p>

                {/* Bottom Row: Badges, Wait Time & Channel */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {c.subject?.toLowerCase().includes('voice') ? (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Phone className="w-3 h-3" /> Voice
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sky-400">
                        <MessageSquare className="w-3 h-3" /> Web Chat
                      </span>
                    )}
                    {getSentimentBadge(c.escalation?.sentiment)}
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatElapsed(c.createdAt)}</span>
                  </div>
                </div>

                {/* Assignment Status Indicator */}
                {isAssignedToMe && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    <UserCheck className="w-3 h-3" /> You
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
