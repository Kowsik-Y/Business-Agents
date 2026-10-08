'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Search, History, RefreshCw } from 'lucide-react';
import { getAuditLogs, type AuditRecord } from './auditHelper';

export function AuditChangeLogs() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');

  const loadLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || log.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="glass-panel p-6 border border-white/10 space-y-5 animate-fade-in">
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Immutable Audit & Change Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-proof chronological evidence of all policy adjustments, version promotions, and four-eyes co-signatures.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search author, action or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all w-56"
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-white/10 focus:outline-none cursor-pointer"
          >
            <option value="All">All Domains</option>
            <option value="AI Tools">AI Tools</option>
            <option value="Prompts">Prompts</option>
            <option value="Feature Flags">Feature Flags</option>
            <option value="Routing">Routing</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all"
            title="Refresh Audit Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/50">
              <th className="py-3 px-4 rounded-tl-lg">Record & Date</th>
              <th className="py-3 px-4">Domain</th>
              <th className="py-3 px-4">Configuration Action</th>
              <th className="py-3 px-4">Sign-off Evidence</th>
              <th className="py-3 px-4 text-right rounded-tr-lg">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No audit trail records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-indigo-400 block">{log.id}</span>
                    <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
                  </td>

                  <td className="py-4 px-4">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 font-mono">
                      {log.domain}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-slate-200 font-medium max-w-md">
                    {log.action}
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Target Release: {log.version}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="text-slate-200 font-bold block">Author: {log.author}</span>
                      {log.approver && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          4-Eyes Approver: {log.approver}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'Committed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      log.status === 'Pending 4-Eyes' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
