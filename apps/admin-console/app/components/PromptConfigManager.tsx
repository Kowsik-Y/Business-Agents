'use client';

import React, { useState } from 'react';
import { FileText, GitBranch, CheckCircle, RefreshCcw, Cpu } from 'lucide-react';
import type { AdminProfile } from './AdminAuthModal';
import { recordAuditEvent } from './auditHelper';

interface PromptVersion {
  version: string;
  tag: 'PROD-ACTIVE' | 'ROLLBACK-CANDIDATE' | 'STAGING-EVAL';
  author: string;
  timestamp: string;
  regressionStatus: 'Passed (100%)' | 'Passed (98.4%)' | 'Running (45%)';
  systemPrompt: string;
  model: string;
}

interface Props {
  activeAdmin?: AdminProfile;
}

export function PromptConfigManager({ activeAdmin }: Props) {
  const [versions, setVersions] = useState<PromptVersion[]>([
    {
      version: 'v7.4.2',
      tag: 'PROD-ACTIVE',
      author: 'Sarah Jenkins (Administrator)',
      timestamp: '2026-08-05 11:30:00 UTC',
      regressionStatus: 'Passed (100%)',
      model: 'navigatelabsai/v1 (Enterprise Fast-Inference)',
      systemPrompt: 'You are an empathetic, professional AI Customer Success Assistant for an enterprise service platform. Ground your answers strictly on verified tool data provided. Be concise, warm, and helpful. Avoid speculation.',
    },
    {
      version: 'v7.4.1',
      tag: 'ROLLBACK-CANDIDATE',
      author: 'David Chen (DevOps Lead)',
      timestamp: '2026-08-03 14:15:22 UTC',
      regressionStatus: 'Passed (98.4%)',
      model: 'gpt-4o-mini',
      systemPrompt: 'You are an AI support agent for Customer Success Platform. Use available tools to check order tracking and resolve billing issues. Never invent order numbers.',
    },
    {
      version: 'v7.5.0-RC1',
      tag: 'STAGING-EVAL',
      author: 'AI Alignment Pipeline',
      timestamp: '2026-08-05 15:45:10 UTC',
      regressionStatus: 'Running (45%)',
      model: 'navigatelabsai/v1-reasoner',
      systemPrompt: 'You are a Senior AI Customer Success Architect. Proactively analyze sentiment tone and execute multi-step tool workflows before proposing human handoffs.',
    },
  ]);

  const [selectedVersion, setSelectedVersion] = useState<string>('v7.4.2');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const author = activeAdmin ? `${activeAdmin.name} (${activeAdmin.roleTitle})` : 'System Administrator';
  const current = versions.find((v) => v.version === selectedVersion) || versions[0]!;

  const handlePromote = (ver: string, isRollback = false) => {
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        tag: v.version === ver ? 'PROD-ACTIVE' : v.tag === 'PROD-ACTIVE' ? 'ROLLBACK-CANDIDATE' : v.tag,
      }))
    );

    recordAuditEvent({
      domain: 'Prompts',
      action: isRollback ? `Executed emergency rollback to stable prompt version ${ver}` : `Promoted system prompt candidate ${ver} to production`,
      author,
      version: ver,
      status: isRollback ? 'Rolled Back' : 'Committed',
    });

    const msg = isRollback
      ? `Emergency Rollback: Restored ${ver} as active production prompt. Logged to Immutable Audit Ledger.`
      : `Successfully promoted ${ver} to production. Previous production version archived as rollback candidate.`;
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  const handleRollback = () => {
    const rollbackCandidate = versions.find((v) => v.tag === 'ROLLBACK-CANDIDATE');
    if (rollbackCandidate) {
      handlePromote(rollbackCandidate.version, true);
      setSelectedVersion(rollbackCandidate.version);
    } else {
      setActionFeedback('No fallback candidate found.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Column: Version History */}
      <div className="glass-panel p-5 border border-white/10 flex flex-col justify-between space-y-4 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Configuration Versions
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">3 Archived</span>
          </div>

          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.version}
                onClick={() => setSelectedVersion(v.version)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-2 ${
                  selectedVersion === v.version
                    ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900/50 border-white/5 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100 font-mono">{v.version}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${
                    v.tag === 'PROD-ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    v.tag === 'ROLLBACK-CANDIDATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {v.tag}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[150px]">{v.author}</span>
                  <span className="font-mono">{v.timestamp.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleRollback}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Instant Emergency Rollback
          </button>
        </div>
      </div>

      {/* Right Column: Prompt & Regression Inspector */}
      <div className="glass-panel p-6 border border-white/10 lg:col-span-2 space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          {actionFeedback && (
            <div className="bg-indigo-500/15 border border-indigo-500/40 text-indigo-200 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">{current.version}</h2>
                <span className="text-xs text-slate-400 font-normal">({current.timestamp})</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Author: <strong className="text-slate-200">{current.author}</strong></p>
            </div>

            {current.tag !== 'PROD-ACTIVE' && (
              <button
                onClick={() => handlePromote(current.version)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Activate to Production
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Target AI Model
              </label>
              <span className="text-indigo-400 font-mono font-medium bg-slate-900 px-2.5 py-1 rounded border border-white/5">
                {current.model}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                System Prompt Template
              </label>
              <textarea
                readOnly
                value={current.systemPrompt}
                rows={5}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-4 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500/50 resize-none selection:bg-indigo-500/30"
              />
            </div>
          </div>

          {/* Regression Diagnostics Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${current.regressionStatus.includes('100%') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Automated Regression Evaluation</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tests 1,000 simulated golden transcripts for groundedness & schema compliance.</p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded ${
              current.regressionStatus.includes('Passed') ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
            }`}>
              {current.regressionStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
