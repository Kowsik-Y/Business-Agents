'use client';

import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  BookOpen,
  ShieldAlert,
} from 'lucide-react';
import type { HandoffPackage } from '@csp/contracts';

interface HandoffPackageCardProps {
  handoffPackage: HandoffPackage;
}

export function HandoffPackageCard({ handoffPackage }: HandoffPackageCardProps) {
  const {
    summary,
    activeIntent,
    secondaryIntents = [],
    riskLevel,
    informationCollected = {},
    missingInformation = [],
    actionsAttempted = [],
    retrievedSources = [],
    escalationReason,
    recommendedNextAction,
  } = handoffPackage;

  const getRiskBadge = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'high':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> {risk} Risk
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
            Low Risk
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Summary Banner */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Handoff Synthesis</span>
          </div>
          <div className="flex items-center gap-2">
            {getRiskBadge(riskLevel)}
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          {summary || 'AI escalated conversation for human representative intervention.'}
        </p>

        {/* Reason Pill */}
        <div className="mt-2.5 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Escalation Trigger:</span>
          <span className="font-mono text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/40">
            {escalationReason || 'customer_request'}
          </span>
        </div>
      </div>

      {/* Recommended Next Action Callout */}
      {recommendedNextAction && (
        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommended Next Action</span>
          </div>
          <p className="text-xs text-amber-100/90 leading-normal">
            {recommendedNextAction}
          </p>
        </div>
      )}

      {/* Classified Intents */}
      <div className="p-3.5 bg-slate-900/50 border border-white/10 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Intent Classification</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] px-2 py-0.5 bg-sky-950/60 text-sky-300 border border-sky-800/40 rounded-md font-medium">
            Primary: {activeIntent || 'support_inquiry'}
          </span>
          {secondaryIntents.map((intent, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 bg-slate-800/60 text-slate-300 border border-white/5 rounded-md"
            >
              {intent}
            </span>
          ))}
        </div>
      </div>

      {/* Collected vs Missing Information */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Information Collected */}
        <div className="p-3 bg-slate-900/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Information Collected</span>
          </div>

          {Object.keys(informationCollected).length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">None collected yet</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(informationCollected).map(([key, val]) => (
                <div key={key} className="text-[11px] bg-slate-950/50 p-1.5 rounded border border-white/5">
                  <span className="text-slate-400 capitalize">{key}: </span>
                  <span className="text-slate-200 font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Information */}
        <div className="p-3 bg-slate-900/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Missing Information</span>
          </div>

          {missingInformation.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">All info collected</p>
          ) : (
            <div className="space-y-1.5">
              {missingInformation.map((item, idx) => (
                <div
                  key={idx}
                  className="text-[11px] bg-rose-950/20 text-rose-200 p-1.5 rounded border border-rose-800/30"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions Attempted by AI */}
      {actionsAttempted.length > 0 && (
        <div className="p-3 bg-slate-900/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Actions Attempted</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {actionsAttempted.map((action, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/30"
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Retrieved Knowledge Sources */}
      {retrievedSources.length > 0 && (
        <div className="p-3 bg-slate-900/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Referenced Knowledge Sources</span>
          </div>
          <ul className="space-y-1">
            {retrievedSources.map((source, idx) => (
              <li key={idx} className="text-[11px] text-cyan-200/80 hover:text-cyan-200 truncate cursor-pointer">
                • {source}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
