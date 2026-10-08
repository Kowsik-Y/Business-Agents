'use client';

import React, { useState } from 'react';
import { Shield, Wrench, Check, Sliders } from 'lucide-react';
import type { AdminProfile } from './AdminAuthModal';
import { recordAuditEvent } from './auditHelper';

interface ToolPolicy {
  id: string;
  name: string;
  category: 'Orders' | 'Customer' | 'Billing' | 'System';
  description: string;
  autonomousEnabled: boolean;
  requiresFourEyesApproval: boolean;
  minAuthLevel: number; // 0 = Anon, 2 = Standard, 3 = High Assurance
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface Props {
  activeAdmin?: AdminProfile;
}

export function ToolRegistryGovernance({ activeAdmin }: Props) {
  const [tools, setTools] = useState<ToolPolicy[]>([
    { id: 'get_order_status', name: 'get_order_status', category: 'Orders', description: 'Retrieve canonical tracking, carrier, and shipping dates.', autonomousEnabled: true, requiresFourEyesApproval: false, minAuthLevel: 0, riskLevel: 'Low' },
    { id: 'lookup_customer', name: 'lookup_customer', category: 'Customer', description: 'Fetch customer CRM profile, membership level, and open tickets.', autonomousEnabled: true, requiresFourEyesApproval: false, minAuthLevel: 2, riskLevel: 'Low' },
    { id: 'update_shipping_address', name: 'update_shipping_address', category: 'Orders', description: 'Modify target destination for unfulfilled packages.', autonomousEnabled: false, requiresFourEyesApproval: true, minAuthLevel: 2, riskLevel: 'Medium' },
    { id: 'process_refund', name: 'process_refund', category: 'Billing', description: 'Issue automatic monetary refund or ledger credit adjustment.', autonomousEnabled: false, requiresFourEyesApproval: true, minAuthLevel: 3, riskLevel: 'Critical' },
    { id: 'escalate_to_human', name: 'escalate_to_human', category: 'System', description: 'Route active conversational transcript to Tier 2 Agent Console.', autonomousEnabled: true, requiresFourEyesApproval: false, minAuthLevel: 0, riskLevel: 'Low' },
  ]);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const author = activeAdmin ? `${activeAdmin.name} (${activeAdmin.roleTitle})` : 'System Administrator';

  const handleToggleAuto = (id: string) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextVal = !t.autonomousEnabled;
          recordAuditEvent({
            domain: 'AI Tools',
            action: `${nextVal ? 'Enabled' : 'Disabled'} autonomous execution for tool '${id}'`,
            author,
            version: 'v7.4.3',
            status: 'Committed',
          });
          return { ...t, autonomousEnabled: nextVal };
        }
        return t;
      })
    );
    showNotice(`Updated autonomous policy for ${id} (Logged to Audit Ledger)`);
  };

  const handleToggleFourEyes = (id: string) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextVal = !t.requiresFourEyesApproval;
          recordAuditEvent({
            domain: 'AI Tools',
            action: `${nextVal ? 'Enforced' : 'Exempted'} Four-Eyes co-signature requirement on '${id}'`,
            author,
            version: 'v7.4.3',
            status: 'Committed',
          });
          return { ...t, requiresFourEyesApproval: nextVal };
        }
        return t;
      })
    );
    showNotice(`Updated four-eyes governance threshold for ${id} (Logged to Audit Ledger)`);
  };

  const handleAuthChange = (id: string, level: number) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          recordAuditEvent({
            domain: 'AI Tools',
            action: `Modified minimum mandatory authentication on '${id}' to Level ${level}`,
            author,
            version: 'v7.4.3',
            status: 'Committed',
          });
          return { ...t, minAuthLevel: level };
        }
        return t;
      })
    );
    showNotice(`Updated mandatory authentication level for ${id} (Logged to Audit Ledger)`);
  };

  const showNotice = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notice Banner */}
      {savedMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {savedMessage}
          <span className="ml-auto text-slate-400 font-normal">Signed by: {activeAdmin?.name || 'Admin'}</span>
        </div>
      )}

      <div className="glass-panel p-6 border border-white/10 space-y-5">
        <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              AI Tool Registry & Governance Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure autonomous execution privileges, minimum authentication assurance levels, and human-in-the-loop overrides.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs text-indigo-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Active Policy Engine: <strong className="text-white">Strict-Enforcement</strong></span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/50">
                <th className="py-3 px-4 rounded-tl-lg">Tool & Category</th>
                <th className="py-3 px-4">Risk Classification</th>
                <th className="py-3 px-4 text-center">Autonomous Execution</th>
                <th className="py-3 px-4 text-center">Four-Eyes Approval</th>
                <th className="py-3 px-4 rounded-tr-lg">Min Assurance Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 max-w-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-slate-800 border border-white/5 text-indigo-400">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 font-mono text-sm">{tool.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-white/5 font-mono">{tool.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{tool.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      tool.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      tool.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {tool.riskLevel} Risk
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleAuto(tool.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tool.autonomousEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tool.autonomousEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleFourEyes(tool.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tool.requiresFourEyesApproval ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tool.requiresFourEyesApproval ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-4 px-4">
                    <select
                      value={tool.minAuthLevel}
                      onChange={(e) => handleAuthChange(tool.id, Number(e.target.value))}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value={0}>Level 0 (Anonymous Public)</option>
                      <option value={2}>Level 2 (Verified Standard)</option>
                      <option value={3}>Level 3 (MFA High Assurance)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
