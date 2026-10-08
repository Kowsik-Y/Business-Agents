'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Wrench, FileText, Sliders, History, ExternalLink, LogIn } from 'lucide-react';
import { ServiceHealthDashboard } from './components/ServiceHealthDashboard';
import { ToolRegistryGovernance } from './components/ToolRegistryGovernance';
import { PromptConfigManager } from './components/PromptConfigManager';
import { FeatureFlagsPolicies } from './components/FeatureFlagsPolicies';
import { AuditChangeLogs } from './components/AuditChangeLogs';
import { AdminAuthModal, DEFAULT_ADMIN_PROFILES, type AdminProfile } from './components/AdminAuthModal';

type ActiveTab = 'health' | 'tools' | 'prompts' | 'flags' | 'audit';

export default function AdminConsoleHome() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('health');
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILES[0]!);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedId = localStorage.getItem('csp_active_admin_id');
    if (savedId) {
      const customStore = localStorage.getItem('csp_custom_admin_profiles');
      let custom: AdminProfile[] = [];
      if (customStore) {
        try { custom = JSON.parse(customStore); } catch { /* ignore */ }
      }
      const all = [...custom, ...DEFAULT_ADMIN_PROFILES];
      const found = all.find((a) => a.id === savedId);
      if (found) setActiveAdmin(found);
    }
  }, []);

  const handleSelectAdmin = (admin: AdminProfile) => {
    setActiveAdmin(admin);
    localStorage.setItem('csp_active_admin_id', admin.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#090d16] text-slate-100 flex flex-col overflow-y-auto pb-16 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090d16]/85 border-b border-white/10 px-6 py-4 transition-all shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30 text-white flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  Platform Governance & Admin Console
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  MFA Level-{activeAdmin.authLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Business Agent • Zero-Database Platform Config
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cluster Healthy
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono">v7.4.2-PROD</span>
            </div>

            {/* Interactive Admin Role Switcher */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 border border-white/15 hover:border-indigo-500/50 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow"
              title="Click to perform dynamic login or assume administrative identity"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeAdmin.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow shrink-0`}>
                {activeAdmin.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{activeAdmin.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-normal">
                    L{activeAdmin.authLevel}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">{activeAdmin.id} ({activeAdmin.roleTitle.split('&')[0]})</span>
              </div>
              <LogIn className="w-4 h-4 text-indigo-400 ml-1" />
            </button>

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors hidden md:flex items-center gap-1.5"
            >
              <span>Agent Console</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 pt-8 flex-1 space-y-8">
        {/* Tab Navigation */}
        <div className="border-b border-white/10 flex items-center gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-3 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'health'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Platform Telemetry & Health
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-3 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tools'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Wrench className="w-4 h-4" />
            AI Tool Governance Matrix
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-3 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prompt Versions & Rollback
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-3 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'flags'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Feature Flags & Routing
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            Immutable Audit Ledger
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'health' && <ServiceHealthDashboard />}
          {activeTab === 'tools' && <ToolRegistryGovernance activeAdmin={activeAdmin} />}
          {activeTab === 'prompts' && <PromptConfigManager activeAdmin={activeAdmin} />}
          {activeTab === 'flags' && <FeatureFlagsPolicies activeAdmin={activeAdmin} />}
          {activeTab === 'audit' && <AuditChangeLogs />}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 pt-12 text-[11px] text-slate-500 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 mt-12">
        <p>Business Agent Platform v0.1.0 (PROD)</p>
        <div className="flex items-center gap-4">
          <span>Active Admin: <strong className="text-slate-300">{activeAdmin.name}</strong></span>
          <span>•</span>
          <span className="text-emerald-400">Zero-DB Configuration Enabled</span>
        </div>
      </footer>

      {/* Admin Role Switcher Modal */}
      <AdminAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        activeAdmin={activeAdmin}
        onSelectAdmin={handleSelectAdmin}
      />
    </div>
  );
}
