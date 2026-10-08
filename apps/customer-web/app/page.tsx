'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Ticket,
  History,
  Mail,
  Database,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X,
  Plus,
  CheckCircle2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useCustomer } from './components/CustomerContext';
import { useApi } from '@/lib/use-api';

interface DashboardStats {
  orchestrator: {
    status: string;
    requestsTotal: number;
    policyViolations: number;
  };
  tickets: {
    open: number;
    inProgress: number;
    resolved: number;
    requiresAction: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'case' | 'system' | 'alert';
    status: string;
    priority: string;
  }>;
  _fallback: boolean;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  case: <Mail className="size-4" />,
  system: <Database className="size-4" />,
  alert: <AlertTriangle className="size-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  healthy: 'text-tertiary-fixed',
  degraded: 'text-amber-400',
  offline: 'text-error',
  unknown: 'text-outline',
};

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

export default function DashboardOverviewPage() {
  const { activeProfile } = useCustomer();
  const { data: stats, loading, isFallback, refetch } = useApi<DashboardStats>('/api/dashboard/stats');
  const [insightDismissed, setInsightDismissed] = useState(false);
  const [protocolActivated, setProtocolActivated] = useState(false);

  const orch = stats?.orchestrator;
  const tickets = stats?.tickets;
  const recent = stats?.recentActivity || [];

  return (
    <div className="p-margin-desktop w-full max-w-container-max mx-auto flex flex-col gap-stack-lg animate-in fade-in duration-300">
      {/* Fallback Indicator */}
      {isFallback && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-xs text-amber-300">
          <WifiOff className="size-3.5" />
          <span>Some backend services are offline. Displaying available data with fallback defaults.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Overview
          </h2>
          <p className="font-body-md text-body-md text-outline mt-1">
            System status, live orchestrations, and active identity: <span className="text-primary font-medium">{activeProfile.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="text-xs text-outline hover:text-on-surface transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/chat"
            className="bg-gradient-to-r from-inverse-primary to-secondary-container text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(73,75,214,0.3)] active:scale-95 shrink-0"
          >
            <Plus className="size-4" />
            <span>New Request</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-stack-md">
        {/* AI Orchestrator Status (Hero Card) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-white/10 rounded-xl p-stack-md relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start relative z-10 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg border border-primary/30 flex items-center justify-center bg-primary/10 text-primary">
                <Cpu className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-md text-[18px] font-semibold text-on-surface">
                  AI Orchestrator
                </h3>
                <span className="text-[11px] font-mono text-outline">LangGraph State Engine</span>
              </div>
            </div>
            {loading ? (
              <Skeleton className="w-32 h-7 rounded-full" />
            ) : (
              <div className={`flex items-center gap-2 ${
                orch?.status === 'healthy'
                  ? 'bg-tertiary-container/20 border-tertiary-fixed-dim/30'
                  : orch?.status === 'offline'
                  ? 'bg-error-container/20 border-error/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              } border px-3 py-1 rounded-full ai-glow`}>
                <div className={`size-2 rounded-full ${
                  orch?.status === 'healthy' ? 'bg-tertiary-fixed pulse-dot' : orch?.status === 'offline' ? 'bg-error' : 'bg-amber-400 pulse-dot'
                }`} />
                <span className={`font-label-mono text-label-mono uppercase font-semibold ${STATUS_COLORS[orch?.status || 'unknown']}`}>
                  {orch?.status === 'healthy' ? 'System Healthy' : orch?.status === 'offline' ? 'Offline' : orch?.status || 'Checking...'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 my-6 flex-1">
            <div className="p-3 rounded-lg bg-surface-container/50 border border-white/5">
              <p className="font-label-mono text-label-mono text-outline mb-1">Total Turns</p>
              {loading ? (
                <Skeleton className="w-16 h-10 mt-1" />
              ) : (
                <div className="font-display-lg text-display-lg text-on-surface font-bold">
                  {orch?.requestsTotal ?? 0}
                </div>
              )}
              <p className="font-body-sm text-xs text-outline-variant mt-2">AI assistant turns processed</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container/50 border border-white/5">
              <p className="font-label-mono text-label-mono text-outline mb-1">Policy Violations</p>
              {loading ? (
                <Skeleton className="w-12 h-10 mt-1" />
              ) : (
                <div className={`font-display-lg text-display-lg font-bold ${(orch?.policyViolations ?? 0) > 0 ? 'text-error' : 'text-on-surface'}`}>
                  {orch?.policyViolations ?? 0}
                </div>
              )}
              <p className="font-body-sm text-xs text-outline-variant mt-2">Prompt injections blocked</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container/50 border border-white/5">
              <p className="font-label-mono text-label-mono text-outline mb-1">Active Cases</p>
              {loading ? (
                <Skeleton className="w-12 h-10 mt-1" />
              ) : (
                <div className="font-display-lg text-display-lg text-on-surface font-bold">
                  {(tickets?.open ?? 0) + (tickets?.inProgress ?? 0)}
                </div>
              )}
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{
                    width: tickets && tickets.total > 0
                      ? `${Math.round(((tickets.open + tickets.inProgress) / tickets.total) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-outline border-t border-white/5 pt-3 relative z-10">
            <span>Core API: localhost:8000 • AI Orchestrator: localhost:8002</span>
            <span className="font-mono text-primary/80">WebSocket Voice: 24kHz</span>
          </div>
        </div>

        {/* Live Tickets Metrics Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-white/10 rounded-xl p-stack-md flex flex-col justify-between">
          <div className="border-b border-white/5 pb-4 mb-4">
            <h3 className="font-headline-md text-[16px] text-on-surface flex items-center gap-2 font-semibold">
              <Ticket className="size-4 text-outline" />
              <span>Ticket Queue</span>
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="flex justify-between items-end">
              <div>
                {loading ? (
                  <Skeleton className="w-14 h-12 mb-2" />
                ) : (
                  <div className="font-display-lg text-[42px] leading-none text-on-surface font-bold">
                    {(tickets?.open ?? 0) + (tickets?.inProgress ?? 0)}
                  </div>
                )}
                <div className="font-label-mono text-label-mono text-error mt-2 flex items-center gap-1.5 font-medium">
                  <div className="size-2 rounded-full bg-error" /> Awaiting Action
                </div>
              </div>
              <div className="text-end">
                {loading ? (
                  <Skeleton className="w-12 h-8 mb-1 ml-auto" />
                ) : (
                  <div className="font-headline-md text-[26px] text-on-surface-variant font-bold">
                    {tickets?.resolved ?? 0}
                  </div>
                )}
                <div className="font-label-mono text-label-mono text-outline mt-1">Resolved</div>
              </div>
            </div>

            <Link
              href="/tickets"
              className="w-full py-2.5 rounded-lg border border-white/10 text-on-surface text-xs font-semibold hover:bg-white/10 hover:border-primary/40 transition-all text-center block active:scale-95"
            >
              View All Tickets
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-white/10 rounded-xl p-stack-md">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-2">
            <h3 className="font-headline-md text-[16px] text-on-surface flex items-center gap-2 font-semibold">
              <History className="size-4 text-outline" />
              <span>Recent Activity</span>
            </h3>
            <Link href="/tickets" className="text-primary text-xs font-medium hover:underline flex items-center gap-1">
              See all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="flex flex-col">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/5">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="w-16 h-3" />
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="py-8 text-center text-xs text-outline">
                No recent activity found. Cases created in the system will appear here.
              </div>
            ) : (
              recent.map((item) => (
                <Link
                  key={item.id}
                  href="/tickets"
                  className="group flex items-center justify-between py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors -mx-stack-md px-stack-md cursor-pointer rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-8 rounded-full bg-surface border flex items-center justify-center shrink-0 ${
                      item.priority === 'high' || item.priority === 'critical'
                        ? 'border-error/30 text-error'
                        : item.status === 'resolved' || item.status === 'closed'
                        ? 'border-tertiary/30 text-tertiary'
                        : 'border-white/10 text-primary'
                    }`}>
                      {item.priority === 'high' || item.priority === 'critical'
                        ? ACTIVITY_ICONS.alert
                        : ACTIVITY_ICONS.case}
                    </div>
                    <div>
                      <p className="font-body-sm text-sm text-on-surface font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </p>
                      <p className="font-label-mono text-xs text-outline mt-0.5 line-clamp-1">
                        Case #{item.id.substring(0, 8)} • {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-label-mono text-xs text-outline">{formatTimeAgo(item.timestamp)}</span>
                    <ArrowRight className="size-4 text-outline-variant opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* AI Insight Card */}
        {!insightDismissed ? (
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-gradient-to-b from-primary-container/15 to-surface-container-low border border-primary/30 rounded-xl p-stack-md relative ai-glow flex flex-col justify-between">
            <div className="absolute top-4 right-4 text-primary">
              <Sparkles className="size-5 animate-pulse" />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                  Automated Recommendation
                </span>
              </div>
              <h3 className="font-headline-md text-[17px] text-primary font-semibold mt-2.5">
                AI Routing Insight
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
                {tickets && (tickets.open + tickets.inProgress) > 3
                  ? `${tickets.open + tickets.inProgress} active cases detected. Consider activating Tier 2 Routing Protocol to distribute workload.`
                  : 'Based on recent ticket volume, recommending activation of Tier 2 Routing Protocol to alleviate backlog.'}
              </p>
            </div>

            <div className="mt-auto flex gap-2">
              <button
                onClick={() => setProtocolActivated(true)}
                disabled={protocolActivated}
                className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {protocolActivated ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Protocol Active</span>
                  </>
                ) : (
                  <span>Review & Activate</span>
                )}
              </button>
              <button
                onClick={() => setInsightDismissed(true)}
                className="size-9 flex justify-center items-center rounded-lg border border-white/10 text-outline hover:text-on-surface hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-white/10 rounded-xl p-stack-md flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs text-outline">All insights reviewed.</p>
            <button
              onClick={() => {
                setInsightDismissed(false);
                setProtocolActivated(false);
              }}
              className="text-xs text-primary mt-2 hover:underline cursor-pointer"
            >
              Reset suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
