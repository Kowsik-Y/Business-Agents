'use client';

import React from 'react';
import { useCustomer } from '../components/CustomerContext';
import {
  User,
  Key,
  ExternalLink,
  Cpu,
  Server,
  Award,
  Package,
  Loader2,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  _fallback: boolean;
}

export default function SettingsPage() {
  const { activeProfile, setIsAuthOpen } = useCustomer();
  const { data: stats, loading, isFallback } = useApi<DashboardStats>('/api/dashboard/stats');

  const orch = stats?.orchestrator;

  return (
    <div className="p-margin-desktop w-full max-w-container-max mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Platform Settings & Identity
        </h2>
        <p className="text-sm text-outline mt-1">
          Configure customer personas, SLA routing parameters, and telemetry linkages.
        </p>
      </div>

      {isFallback && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-xs text-amber-300">
          <WifiOff className="size-3.5" />
          <span>Some backend services are offline. Displaying available data with fallback defaults.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Customer Profile Card */}
        <div className="glass-panel rounded-xl p-6 bg-surface-container-low border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span>Active Customer Identity</span>
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/15 text-primary border-primary/30">
              L{activeProfile.authLevel} Auth
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="size-14 shadow-lg border border-white/10">
              <AvatarFallback className={`bg-gradient-to-tr ${activeProfile.avatarColor} text-sm font-bold text-white`}>
                {activeProfile.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-on-surface">{activeProfile.name}</h4>
              <p className="text-xs font-mono text-outline">{activeProfile.email}</p>
              <p className="text-xs font-mono text-primary/90">{activeProfile.id}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-outline flex items-center gap-1.5">
                <Award className="size-3.5 text-purple-400" /> Membership Tier
              </span>
              <span className="font-semibold text-purple-300">{activeProfile.tier}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-outline flex items-center gap-1.5">
                <Package className="size-3.5 text-cyan-400" /> Active Tracked Order
              </span>
              <span className="font-mono font-bold text-cyan-300">{activeProfile.activeOrder}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-outline flex items-center gap-1.5">
                <Key className="size-3.5 text-amber-400" /> Security Clearance
              </span>
              <span className="font-mono text-on-surface">Level {activeProfile.authLevel} (Verified)</span>
            </div>
          </div>

          <Button
            onClick={() => setIsAuthOpen(true)}
            className="w-full bg-gradient-to-r from-primary to-inverse-primary text-white text-xs font-semibold rounded-lg py-2 hover:opacity-90 transition-all cursor-pointer shadow"
          >
            Switch Persona / Custom Login
          </Button>
        </div>

        {/* Right Columns (Spans 2): Orchestration & System Links */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Orchestrator Parameters — now with live data */}
          <div className="glass-panel rounded-xl p-6 bg-surface-container-low border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="size-5 text-tertiary" />
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Orchestrator Governance & Real-Time Engine
                </h3>
              </div>
              {loading ? (
                <Loader2 className="size-4 text-outline animate-spin" />
              ) : (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    orch?.status === 'healthy'
                      ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                      : orch?.status === 'offline'
                      ? 'bg-error/15 text-error border-error/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {orch?.status === 'healthy' ? 'Active' : orch?.status === 'offline' ? 'Offline' : orch?.status || 'Checking...'}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline">LangGraph Node Execution</span>
                  <span className={`font-mono font-bold ${orch?.status === 'healthy' ? 'text-emerald-400' : 'text-outline'}`}>
                    {orch?.status === 'healthy' ? 'Enabled' : orch?.status === 'offline' ? 'Unavailable' : '...'}
                  </span>
                </div>
                <p className="text-[11px] text-outline">State machines handling customer intent classification and tools.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline">Total Turns Processed</span>
                  <span className="text-primary font-mono font-bold">
                    {loading ? '...' : orch?.requestsTotal ?? 0}
                  </span>
                </div>
                <p className="text-[11px] text-outline">AI assistant turns executed since last service restart.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline">Policy Violations Blocked</span>
                  <span className={`font-mono font-bold ${(orch?.policyViolations ?? 0) > 0 ? 'text-error' : 'text-emerald-400'}`}>
                    {loading ? '...' : orch?.policyViolations ?? 0}
                  </span>
                </div>
                <p className="text-[11px] text-outline">Prompt injection attempts caught by security guardrails.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline">Active Cases</span>
                  <span className="text-tertiary font-mono font-bold">
                    {loading ? '...' : (stats?.tickets.open ?? 0) + (stats?.tickets.inProgress ?? 0)}
                  </span>
                </div>
                <p className="text-[11px] text-outline">Open and in-progress cases from Core API database.</p>
              </div>
            </div>
          </div>

          {/* External Ecosystem Consoles */}
          <div className="glass-panel rounded-xl p-6 bg-surface-container-low border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Server className="size-4 text-outline" />
              <h3 className="text-sm font-bold text-on-surface">Integrated Control Portals</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="group p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                    Agent Console
                    <ExternalLink className="size-3" />
                  </h4>
                  <p className="text-[11px] text-outline mt-1">Live agent supervisor desk & human handoff</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  :3001
                </Badge>
              </a>

              <a
                href="http://localhost:3002"
                target="_blank"
                rel="noreferrer"
                className="group p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                    Admin Governance Portal
                    <ExternalLink className="size-3" />
                  </h4>
                  <p className="text-[11px] text-outline mt-1">System policies, token cost, and SLA analytics</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  :3002
                </Badge>
              </a>

              <a
                href="http://localhost:8000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="group p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                    Core API Swagger
                    <ExternalLink className="size-3" />
                  </h4>
                  <p className="text-[11px] text-outline mt-1">REST API documentation for cases, conversations, workflows</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  :8000
                </Badge>
              </a>

              <a
                href="http://localhost:8002/docs"
                target="_blank"
                rel="noreferrer"
                className="group p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                    AI Orchestrator Docs
                    <ExternalLink className="size-3" />
                  </h4>
                  <p className="text-[11px] text-outline mt-1">LangGraph turns, health, and metrics endpoints</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  :8002
                </Badge>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
