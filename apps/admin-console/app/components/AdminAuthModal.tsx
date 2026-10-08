'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle2, LogIn, UserCheck, UserPlus, ArrowRight, Tag, Briefcase } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface AdminProfile {
  id: string;
  name: string;
  roleTitle: string;
  authLevel: number;
  permissions: string[];
  avatarColor: string;
  isCustom?: boolean;
}

export const DEFAULT_ADMIN_PROFILES: AdminProfile[] = [
  {
    id: 'ADM-001',
    name: 'Kowsik Y.',
    roleTitle: 'Chief Platform Architect & Root Admin',
    authLevel: 3,
    permissions: ['root', 'super_admin', 'emergency_rollback', 'policy_writer'],
    avatarColor: 'from-indigo-600 to-cyan-500',
  },
  {
    id: 'ADM-002',
    name: 'Sarah Jenkins',
    roleTitle: 'AI Governance & DevOps Supervisor',
    authLevel: 3,
    permissions: ['super_admin', 'prompt_promoter', 'feature_flags'],
    avatarColor: 'from-purple-600 to-pink-500',
  },
  {
    id: 'ADM-003',
    name: 'David Chen',
    roleTitle: 'Compliance Auditor & 4-Eyes Signer',
    authLevel: 3,
    permissions: ['four_eyes_approver', 'compliance_officer', 'audit_ledger'],
    avatarColor: 'from-emerald-600 to-teal-500',
  },
];

const AVATAR_COLORS = [
  'from-indigo-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-amber-500 to-orange-600',
  'from-rose-600 to-red-500',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeAdmin: AdminProfile;
  onSelectAdmin: (admin: AdminProfile) => void;
}

export function AdminAuthModal({ isOpen, onClose, activeAdmin, onSelectAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<'login' | 'saved'>('login');
  const [savedProfiles, setSavedProfiles] = useState<AdminProfile[]>(DEFAULT_ADMIN_PROFILES);

  // Dynamic Login form state
  const [name, setName] = useState('');
  const [adminId, setAdminId] = useState('ADM-' + Math.floor(100 + Math.random() * 900));
  const [roleTitle, setRoleTitle] = useState('Senior DevOps & Governance Lead');
  const [authLevel, setAuthLevel] = useState<number>(3);
  const [permissions, setPermissions] = useState<string[]>(['super_admin', 'policy_writer', 'four_eyes_approver']);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('csp_custom_admin_profiles');
    if (stored) {
      try {
        const custom: AdminProfile[] = JSON.parse(stored);
        setSavedProfiles([...custom, ...DEFAULT_ADMIN_PROFILES]);
      } catch {
        // use default
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePerm = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleDynamicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsVerifying(true);
    setTimeout(() => {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!;
      
      const newAdmin: AdminProfile = {
        id: adminId.trim() || `ADM-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        authLevel,
        permissions: permissions.length > 0 ? permissions : ['super_admin'],
        avatarColor: randomColor,
        isCustom: true,
      };

      const existingCustom = localStorage.getItem('csp_custom_admin_profiles');
      let updated: AdminProfile[] = [newAdmin];
      if (existingCustom) {
        try {
          const parsed = JSON.parse(existingCustom);
          updated = [newAdmin, ...parsed.filter((p: AdminProfile) => p.id !== newAdmin.id)];
        } catch {
          // ignore
        }
      }
      localStorage.setItem('csp_custom_admin_profiles', JSON.stringify(updated));

      setIsVerifying(false);
      onSelectAdmin(newAdmin);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-[#0f172a] border-white/15 text-slate-100 p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-white tracking-tight">
              Administrator Assurance & Dynamic Auth
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Sign in dynamically with high-assurance Tier 3 administrative privileges to generate authentic audit signatures.
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
            Dynamic Admin Login
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
            Saved & Demo Admins ({savedProfiles.length})
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleDynamicLogin} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Admin Name / Identity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kowsik Y. or Sarah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> Admin / Security Badge ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADM-990"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Administrative Role Title
                </label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-purple-300 font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Governance Scope (Toggle permissions)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'root', label: 'Root Privileges' },
                    { id: 'super_admin', label: 'Super Admin' },
                    { id: 'policy_writer', label: 'Policy Writer' },
                    { id: 'prompt_promoter', label: 'Prompt Promoter' },
                    { id: 'four_eyes_approver', label: '4-Eyes Approver' },
                    { id: 'emergency_rollback', label: 'Emergency Rollback' },
                  ].map((perm) => {
                    const active = permissions.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePerm(perm.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                          active
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900 text-slate-500 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {active ? `✓ ${perm.label}` : `+ ${perm.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> Mandatory Assurance & Security Clearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { level: 2, title: 'Level 2 (Standard)', desc: 'Read-Only audit view' },
                    { level: 3, title: 'Level 3 (High MFA)', desc: 'Promote prompts & tools' },
                    { level: 4, title: 'Level 4 (Hardware HSM)', desc: 'Full root Zero-DB config' },
                  ].map((item) => (
                    <div
                      key={item.level}
                      onClick={() => setAuthLevel(item.level)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        authLevel === item.level
                          ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/10'
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
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isVerifying ? (
                  <span>Authenticating Administrator...</span>
                ) : (
                  <>
                    <span>Launch Admin Governance Console</span>
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
              {savedProfiles.map((admin) => {
                const isSelected = activeAdmin.id === admin.id;
                return (
                  <div
                    key={admin.id}
                    onClick={() => {
                      onSelectAdmin(admin);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${admin.avatarColor} flex items-center justify-center font-bold text-white text-sm shadow shrink-0`}>
                        {admin.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{admin.name}</h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Key className="w-2.5 h-2.5" />
                            MFA Level {admin.authLevel}
                          </span>
                          {admin.isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{admin.roleTitle} ({admin.id})</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {admin.permissions.map((p) => (
                            <span key={p} className="text-[10px] font-mono px-2 py-0.2 bg-slate-800 text-slate-300 rounded border border-white/5 uppercase">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Active Admin
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 hover:underline">
                        Assume Role <LogIn className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  localStorage.removeItem('csp_custom_admin_profiles');
                  setSavedProfiles(DEFAULT_ADMIN_PROFILES);
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 underline transition-colors"
              >
                Clear Custom Created Admins
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
