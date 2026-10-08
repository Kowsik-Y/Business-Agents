'use client';

import React, { useState, useEffect } from 'react';
import { Shield, UserCheck, Key, CheckCircle2, LogIn, UserPlus, ArrowRight, Briefcase, Tag } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface AgentProfile {
  id: string;
  name: string;
  title: string;
  authLevel: number;
  roles: string[];
  avatarColor: string;
  isCustom?: boolean;
}

export const DEFAULT_AGENT_PROFILES: AgentProfile[] = [
  {
    id: 'AGT-104',
    name: 'Samantha Rivera',
    title: 'Tier 2 Support & Escalations Specialist',
    authLevel: 2,
    roles: ['support', 'escalation_handler'],
    avatarColor: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'AGT-209',
    name: 'Marcus Vance',
    title: 'Tier 3 Governance & Billing Supervisor',
    authLevel: 3,
    roles: ['support', 'billing', 'approver', 'four_eyes_signer'],
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'AGT-052',
    name: 'Elena Rostova',
    title: 'Tier 1 Support Associate',
    authLevel: 1,
    roles: ['support'],
    avatarColor: 'from-cyan-500 to-blue-600',
  },
];

const AVATAR_COLORS = [
  'from-purple-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeAgent: AgentProfile;
  onSelectAgent: (agent: AgentProfile) => void;
}

export function AgentAuthModal({ isOpen, onClose, activeAgent, onSelectAgent }: Props) {
  const [activeTab, setActiveTab] = useState<'login' | 'saved'>('login');
  const [savedProfiles, setSavedProfiles] = useState<AgentProfile[]>(DEFAULT_AGENT_PROFILES);

  // Dynamic login form state
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('AGT-' + Math.floor(100 + Math.random() * 900));
  const [title, setTitle] = useState('Tier 3 Senior Support Specialist');
  const [authLevel, setAuthLevel] = useState<number>(3);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['support', 'approver', 'four_eyes_signer']);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('csp_custom_agent_profiles');
    if (stored) {
      try {
        const custom: AgentProfile[] = JSON.parse(stored);
        setSavedProfiles([...custom, ...DEFAULT_AGENT_PROFILES]);
      } catch {
        // use default
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleDynamicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsVerifying(true);
    setTimeout(() => {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!;
      
      const newAgent: AgentProfile = {
        id: empId.trim() || `AGT-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        title: title.trim(),
        authLevel,
        roles: selectedRoles.length > 0 ? selectedRoles : ['support'],
        avatarColor: randomColor,
        isCustom: true,
      };

      const existingCustom = localStorage.getItem('csp_custom_agent_profiles');
      let updated: AgentProfile[] = [newAgent];
      if (existingCustom) {
        try {
          const parsed = JSON.parse(existingCustom);
          updated = [newAgent, ...parsed.filter((p: AgentProfile) => p.id !== newAgent.id)];
        } catch {
          // ignore
        }
      }
      localStorage.setItem('csp_custom_agent_profiles', JSON.stringify(updated));

      setIsVerifying(false);
      onSelectAgent(newAgent);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-[#0f172a] border-white/15 text-slate-100 p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-white tracking-tight">
              Agent Credentials & Dynamic Auth
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Sign in with custom agent credentials and select custom RBAC permissions to test Four-Eyes sign-off.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'login'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Dynamic Agent Sign-In
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Saved & Demo Agents ({savedProfiles.length})
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleDynamicLogin} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Agent Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samantha Rivera or Kowsik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> Employee / Agent ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AGT-305"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Job Title & Role Description
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" /> Assign RBAC Permissions (Toggle multi-select)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'support', label: 'Support Agent' },
                    { id: 'billing', label: 'Billing Privileged' },
                    { id: 'escalation_handler', label: 'Escalation Lead' },
                    { id: 'approver', label: 'Tool Approver' },
                    { id: 'four_eyes_signer', label: 'Four-Eyes Signer' },
                  ].map((role) => {
                    const active = selectedRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                          active
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md shadow-purple-500/10'
                            : 'bg-slate-900 text-slate-500 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {active ? `✓ ${role.label}` : `+ ${role.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> Security Assurance & MFA Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { level: 1, title: 'Level 1 (Basic)', desc: 'View cases only' },
                    { level: 2, title: 'Level 2 (OTP)', desc: 'Standard operations' },
                    { level: 3, title: 'Level 3 (High MFA)', desc: 'Can authorize refunds & edits' },
                  ].map((item) => (
                    <div
                      key={item.level}
                      onClick={() => setAuthLevel(item.level)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        authLevel === item.level
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-white/10">
              <button
                type="submit"
                disabled={isVerifying || !name}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isVerifying ? (
                  <span>Authenticating Agent...</span>
                ) : (
                  <>
                    <span>Sign In to Agent Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Saved Profiles Tab */
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              {savedProfiles.map((agent) => {
                const isSelected = activeAgent.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${agent.avatarColor} flex items-center justify-center font-bold text-white text-sm shadow shrink-0`}>
                        {agent.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            L{agent.authLevel} Assurance
                          </span>
                          {agent.isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{agent.title} ({agent.id})</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {agent.roles.map((r) => (
                            <span key={r} className="text-[10px] font-mono px-2 py-0.2 bg-slate-800 text-slate-300 rounded border border-white/5 uppercase">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Active Persona
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 hover:underline">
                        Authenticate <LogIn className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  localStorage.removeItem('csp_custom_agent_profiles');
                  setSavedProfiles(DEFAULT_AGENT_PROFILES);
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 underline transition-colors"
              >
                Clear Custom Created Agents
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
