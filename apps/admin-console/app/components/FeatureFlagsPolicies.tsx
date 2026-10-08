'use client';

import React, { useState } from 'react';
import { Sliders, ToggleLeft, ToggleRight, Clock, Bell, Check } from 'lucide-react';
import type { AdminProfile } from './AdminAuthModal';
import { recordAuditEvent } from './auditHelper';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  targetScope: 'Global (All Users)' | 'VIP Tier Only' | 'Internal Beta' | 'Staging Group';
  lastModified: string;
}

interface Props {
  activeAdmin?: AdminProfile;
}

export function FeatureFlagsPolicies({ activeAdmin }: Props) {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    { id: 'voice_streaming_v2', name: '24kHz High-Fidelity Voice Streaming', description: 'Enable native Web Audio API float32 sample rate streaming without buffering delays.', enabled: true, targetScope: 'Global (All Users)', lastModified: 'Today, 17:00' },
    { id: 'proactive_barge_in', name: 'Instant Barge-In Interruption', description: 'Immediately truncate speech buffers when customer speech begins during AI turn.', enabled: true, targetScope: 'Global (All Users)', lastModified: 'Yesterday' },
    { id: 'vip_priority_routing', name: 'VIP SLA Fast-Path Queue', description: 'Bypass standard intake queues and route direct to Tier 3 human agents for Platinum profiles.', enabled: true, targetScope: 'VIP Tier Only', lastModified: '2 days ago' },
    { id: 'auto_ticket_summarization', name: 'LangGraph Post-Session Compaction', description: 'Automatically generate markdown summaries upon WebSocket close and persist to CRM.', enabled: false, targetScope: 'Internal Beta', lastModified: '5 days ago' },
  ]);

  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [toast, setToast] = useState<string | null>(null);

  const author = activeAdmin ? `${activeAdmin.name} (${activeAdmin.roleTitle})` : 'System Administrator';

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextState = !f.enabled;
          recordAuditEvent({
            domain: 'Feature Flags',
            action: `${nextState ? 'Enabled' : 'Disabled'} platform runtime capability '${f.name}'`,
            author,
            version: 'v7.4.3',
            status: 'Committed',
          });
          return { ...f, enabled: nextState, lastModified: 'Just now' };
        }
        return f;
      })
    );
    showToast(`Toggled flag state for ${id} (Recorded to Immutable Audit Ledger)`);
  };

  const handleBroadcast = () => {
    recordAuditEvent({
      domain: 'Routing',
      action: 'Broadcasted emergency SLA Level-1 incident notice across active agent clusters.',
      author,
      version: 'v7.4.3',
      status: 'Committed',
    });
    showToast('Triggered SLA incident notification across Agent Consoles');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toast}</span>
          <span className="ml-auto text-slate-400 font-normal">Signed by: {activeAdmin?.name || 'Admin'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Flags Col (Takes 2 cols) */}
        <div className="glass-panel p-6 border border-white/10 lg:col-span-2 space-y-5">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Live Feature Flag & Routing Rules
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Toggle runtime platform capabilities without redeploying backend microservices.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
              4 Toggles Active
            </span>
          </div>

          <div className="space-y-3.5">
            {flags.map((flag) => (
              <div
                key={flag.id}
                onClick={() => toggleFlag(flag.id)}
                className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-800/50 border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-200">{flag.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                      {flag.targetScope}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{flag.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">Mod: {flag.lastModified}</span>
                  <div className="text-indigo-400 flex items-center">
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance & Retention Col */}
        <div className="glass-panel p-6 border border-white/10 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Data Retention & Compliance
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Automated purging rules for voice recordings and PII chat logs.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                <span>Conversation Log Retention</span>
                <span className="text-amber-400 font-mono font-bold">{retentionDays} Days</span>
              </label>
              <input
                type="range"
                min={30}
                max={365}
                step={15}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Logs older than {retentionDays} days are stripped of sensitive personal identifiers (PII) before archival to immutable cold storage.
              </p>
            </div>
          </div>

          <div className="pt-5 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              Emergency Broadcast Notice
            </h4>
            <button
              onClick={handleBroadcast}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              Broadcast SLA Warning Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
