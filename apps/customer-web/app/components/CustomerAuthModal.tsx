'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, CheckCircle2, Key, Award, LogIn, UserPlus, Mail, Package, ArrowRight } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  tier: 'VIP Platinum' | 'Gold Member' | 'Standard Tier' | 'Guest (Anonymous)';
  authLevel: number; // 0 = Anon, 1 = Pass, 2 = OTP, 3 = MFA
  activeOrder: string;
  avatarColor: string;
  isCustom?: boolean;
}

export const DEFAULT_PROFILES: CustomerProfile[] = [
  {
    id: 'CUST-1001',
    name: 'Alex Morgan',
    email: 'alex.morgan@enterprise.corp',
    tier: 'VIP Platinum',
    authLevel: 2,
    activeOrder: 'ORD-1001',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'CUST-1002',
    name: 'Jordan Taylor',
    email: 'jordan.taylor@global.tech',
    tier: 'Gold Member',
    authLevel: 2,
    activeOrder: 'ORD-1002',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'CUST-2026',
    name: 'Sam Jenkins',
    email: 'sam.j@innovate.dev',
    tier: 'Standard Tier',
    authLevel: 1,
    activeOrder: 'ORD-2026',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CustomerProfile;
  onSelectProfile: (profile: CustomerProfile) => void;
}

const AVATAR_COLORS = [
  'from-indigo-600 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-orange-500',
  'from-blue-600 to-cyan-500',
  'from-amber-500 to-yellow-600',
];

export function CustomerAuthModal({ isOpen, onClose, activeProfile, onSelectProfile }: Props) {
  const [activeTab, setActiveTab] = useState<'login' | 'saved'>('login');
  const [savedProfiles, setSavedProfiles] = useState<CustomerProfile[]>(DEFAULT_PROFILES);

  // Form State for Dynamic Login / Create Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<CustomerProfile['tier']>('VIP Platinum');
  const [authLevel, setAuthLevel] = useState<number>(2);
  const [orderId, setOrderId] = useState('ORD-' + Math.floor(1000 + Math.random() * 9000));
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('csp_custom_customer_profiles');
    if (stored) {
      try {
        const custom: CustomerProfile[] = JSON.parse(stored);
        setSavedProfiles([...custom, ...DEFAULT_PROFILES]);
      } catch {
        // use default
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDynamicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsVerifying(true);
    setTimeout(() => {
      const newId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!;
      
      const newProfile: CustomerProfile = {
        id: newId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        tier,
        authLevel,
        activeOrder: orderId.trim() || 'ORD-9999',
        avatarColor: randomColor,
        isCustom: true,
      };

      // Persist to local custom account store
      const existingCustom = localStorage.getItem('csp_custom_customer_profiles');
      let updatedCustom: CustomerProfile[] = [newProfile];
      if (existingCustom) {
        try {
          const parsed = JSON.parse(existingCustom);
          updatedCustom = [newProfile, ...parsed.filter((p: CustomerProfile) => p.email !== newProfile.email)];
        } catch {
          // ignore
        }
      }
      localStorage.setItem('csp_custom_customer_profiles', JSON.stringify(updatedCustom));

      setIsVerifying(false);
      onSelectProfile(newProfile);
      onClose();
    }, 600);
  };

  const handleGuestLogin = () => {
    onSelectProfile({
      id: 'CUST-ANON',
      name: 'Guest Customer',
      email: 'anonymous@guest.local',
      tier: 'Guest (Anonymous)',
      authLevel: 0,
      activeOrder: 'ORD-9999',
      avatarColor: 'from-slate-600 to-slate-800',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-[#0f172a] border-white/15 text-slate-100 p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-white tracking-tight">
              Customer Authentication Portal
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Sign in dynamically or generate custom profiles to test any order number and VIP SLA tier.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Mode Tabs */}
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
            Dynamic Login & Custom Account
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
            Saved & Demo Profiles ({savedProfiles.length})
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleDynamicLogin} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name / Persona
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Kowsik Y. or Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border-white/15 focus-visible:ring-indigo-500 text-sm text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border-white/15 focus-visible:ring-indigo-500 text-sm text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> SLA Membership Tier
                </Label>
                <Select value={tier} onValueChange={(val) => setTier(val as CustomerProfile['tier'])}>
                  <SelectTrigger className="w-full bg-slate-900 border-white/15 text-sm font-medium text-purple-300 h-10 rounded-xl">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-slate-200">
                    <SelectItem value="VIP Platinum">VIP Platinum (Direct Fast-Path Routing)</SelectItem>
                    <SelectItem value="Gold Member">Gold Member (Priority SLA)</SelectItem>
                    <SelectItem value="Standard Tier">Standard Tier (Standard Queue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" /> Custom Order to Track
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. ORD-8844"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-slate-900 border-white/15 focus-visible:ring-indigo-500 text-sm text-cyan-300 font-mono font-bold placeholder:text-slate-500 h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Assurance & Authentication Strength
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { level: 1, title: 'Level 1 (Password)', desc: 'Recognized session' },
                    { level: 2, title: 'Level 2 (OTP/SMS)', desc: 'Standard verification' },
                    { level: 3, title: 'Level 3 (MFA/Biometric)', desc: 'High assurance privileged' },
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

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleGuestLogin}
                className="w-full sm:w-auto px-4 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10 cursor-pointer"
              >
                Continue as Anonymous Guest (L0)
              </Button>

              <Button
                type="submit"
                disabled={isVerifying || !name || !email}
                className="w-full sm:w-auto px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Authenticate & Launch Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Saved & Demo Profiles Tab */
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {savedProfiles.map((profile) => {
                const isSelected = activeProfile.id === profile.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => {
                      onSelectProfile(profile);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/25 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${profile.avatarColor} flex items-center justify-center font-bold text-white shadow shrink-0`}>
                          {profile.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="space-y-1 pr-6">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white">{profile.name}</h4>
                            {profile.isCustom && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block">{profile.email}</span>
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              profile.tier.includes('VIP')
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : profile.tier.includes('Gold')
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-white/5'
                            }`}>
                              {profile.tier}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" />
                              Level {profile.authLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-3 border-t border-white/5 font-mono flex items-center justify-between mt-3">
                      <span>Assigned Order:</span>
                      <strong className="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-white/5">{profile.activeOrder}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  localStorage.removeItem('csp_custom_customer_profiles');
                  setSavedProfiles(DEFAULT_PROFILES);
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 underline transition-colors"
              >
                Clear Custom Created Profiles
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
