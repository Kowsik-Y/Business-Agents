'use client';

import React from 'react';
import { ShieldCheck, Mail, Globe, PackageCheck } from 'lucide-react';

interface CustomerProfileCardProps {
  customer?: {
    id: string;
    name?: string;
    email?: string;
    authenticationLevel?: number;
    locale?: string;
    metadata?: Record<string, unknown>;
  } | null;
}

export function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  const name = customer?.name || 'Guest User';
  const email = customer?.email || 'unregistered@session.io';
  const authLevel = customer?.authenticationLevel ?? 0;
  const locale = customer?.locale || 'en-US';

  const getAuthBadge = (level: number) => {
    switch (level) {
      case 3:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Tier 3: Biometric / HW Key
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Tier 2: OTP Verified
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Tier 1: Magic Link
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded">
            Tier 0: Anonymous
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-white/10 rounded-xl space-y-3">
      {/* Top Identity Row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{name}</h3>
            {getAuthBadge(authLevel)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <span className="truncate">{email}</span>
          </div>
        </div>
      </div>

      {/* Metadata Attributes */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Globe className="w-3 h-3 text-slate-500" />
          <span>Locale: <strong className="text-slate-300 font-medium">{locale}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <PackageCheck className="w-3 h-3 text-slate-500" />
          <span>Plan: <strong className="text-indigo-300 font-medium">Enterprise</strong></span>
        </div>
      </div>
    </div>
  );
}
