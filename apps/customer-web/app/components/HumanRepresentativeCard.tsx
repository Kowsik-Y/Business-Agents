'use client';

import React from 'react';
import {
  ShieldCheck,
  Headphones,
  UserCheck,
  Clock,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HumanRepresentativeCardProps {
  representativeName?: string;
  representativeRole?: string;
  caseId?: string;
  orderId?: string;
  orderStatus?: string;
  escalationReason?: string;
  policyLevel?: string;
  onStartVoiceCall?: () => void;
}

export default function HumanRepresentativeCard({
  representativeName = 'Marcus Vance',
  representativeRole = 'Lead Support & Escalation Specialist',
  caseId = 'CASE-ESC-1001',
  orderId = 'ORD-1001',
  orderStatus = 'Cancelled & Refunded',
  escalationReason = 'Four-Eyes Policy: Order Cancellation / High-Risk Action',
  policyLevel = 'Level 3 HITL Supervisor',
  onStartVoiceCall,
}: HumanRepresentativeCardProps) {
  return (
    <div className="w-full my-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-purple-500/30 p-5 sm:p-6 shadow-2xl shadow-purple-950/40 relative overflow-hidden backdrop-blur-xl animate-in fade-in-0 duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Badge & Security Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Human Representative Assigned</span>
          </Badge>
          <Badge variant="outline" className="text-[11px] font-mono bg-white/5 border-white/10 text-slate-300 py-0.5">
            {policyLevel}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Lock className="size-3.5 text-purple-400" />
          <span>Four-Eyes Governance Active</span>
        </div>
      </div>

      {/* Main Representative Profile & Order Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Left Column: Specialist Info */}
        <div className="lg:col-span-7 flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-900/40">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-purple-200 font-bold text-lg sm:text-xl">
                MV
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <CheckCircle2 className="size-3 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {representativeName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                Active in Console
              </span>
            </div>
            <p className="text-xs text-purple-300/90 font-medium mt-0.5">
              {representativeRole}
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your request was routed directly to Marcus Vance in the Agent Command Desk. All conversation history and order details have been synchronized.
            </p>
          </div>
        </div>

        {/* Right Column: Case & Order Governance Metrics */}
        <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Order ID:</span>
            <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {orderId}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Resolution Status:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              {orderStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Escalation Trigger:</span>
            <span className="font-mono text-[11px] text-amber-300">
              Order Modification / Refund
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">SLA Response:</span>
            <span className="font-semibold text-purple-300 flex items-center gap-1">
              <Clock className="size-3.5" />
              &lt; 30s Live Connection
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {onStartVoiceCall && (
            <Button
              onClick={onStartVoiceCall}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="size-3.5" />
              <span>Voice Call Representative</span>
            </Button>
          )}

          <Link
            href="/tickets"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <span>View Ticket Audit Trail</span>
            <ArrowRight className="size-3.5 text-slate-400" />
          </Link>
        </div>

        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Headphones className="size-3.5 text-purple-400" />
          <span>Open Agent Command Desk (Port 3001)</span>
          <ExternalLink className="size-3 text-purple-300" />
        </a>
      </div>
    </div>
  );
}
