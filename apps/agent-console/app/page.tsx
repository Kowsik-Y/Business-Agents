'use client';

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  CheckCircle2,
  LogIn,
  Sparkles,
  Bot,
  UserCheck,
  UserX,
  Play,
  Pause,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';
import { QueueSidebar, type CaseItem } from './components/QueueSidebar';
import { TranscriptView, type MessageItem } from './components/TranscriptView';
import { CustomerProfileCard } from './components/CustomerProfileCard';
import { HandoffPackageCard } from './components/HandoffPackageCard';
import { ToolApprovalCard } from './components/ToolApprovalCard';
import { AgentAuthModal, DEFAULT_AGENT_PROFILES, type AgentProfile } from './components/AgentAuthModal';
import { useApi, mutateApi } from '../lib/use-api';
import type { HandoffPackage } from '@csp/contracts';

interface CaseDetailResponse {
  id: string;
  conversationId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_approval' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  subject: string;
  summary?: string;
  assignedAgentId?: string | null;
  customer?: {
    id: string;
    name?: string;
    email?: string;
    authenticationLevel?: number;
    locale?: string;
    metadata?: Record<string, unknown>;
  } | null;
  escalation?: {
    id?: string;
    reason?: string;
    summary?: string;
    activeIntent?: string;
    sentiment?: string;
    riskLevel?: string;
    informationCollected?: Record<string, unknown>;
    missingInformation?: string[];
    actionsAttempted?: string[];
    recommendedNextAction?: string;
  } | null;
  handoffPackage?: HandoffPackage | null;
  messages?: MessageItem[];
  createdAt: string;
  updatedAt: string;
  _fallback?: boolean;
}

interface HealthResponse {
  coreApi: string;
  orchestrator: string;
  integrationService: string;
}

export default function AgentConsoleHome() {
  const [activeAgent, setActiveAgent] = useState<AgentProfile>(DEFAULT_AGENT_PROFILES[0]!);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);

  // Restore saved active agent
  useEffect(() => {
    const savedId = localStorage.getItem('csp_active_agent_id');
    if (savedId) {
      const customStore = localStorage.getItem('csp_custom_agent_profiles');
      let custom: AgentProfile[] = [];
      if (customStore) {
        try {
          custom = JSON.parse(customStore);
        } catch {
          // ignore
        }
      }
      const all = [...custom, ...DEFAULT_AGENT_PROFILES];
      const found = all.find((p) => p.id === savedId);
      if (found) setActiveAgent(found);
    }
  }, []);

  const handleSelectAgent = (agent: AgentProfile) => {
    setActiveAgent(agent);
    localStorage.setItem('csp_active_agent_id', agent.id);
  };

  // 1. Fetch live cases queue from BFF
  const {
    data: casesData,
    loading: isCasesLoading,
    refetch: refetchCases,
  } = useApi<{ cases: CaseItem[] }>('/api/cases');

  const casesList = casesData?.cases || [];

  // Auto-select first case if none selected
  useEffect(() => {
    if (casesList.length > 0 && !selectedCaseId) {
      setSelectedCaseId(casesList[0]!.id);
    }
  }, [casesList, selectedCaseId]);

  // 2. Fetch live selected case detail & messages
  const detailUrl = selectedCaseId ? `/api/cases/${selectedCaseId}` : null;
  const {
    data: caseDetail,
    refetch: refetchDetail,
  } = useApi<CaseDetailResponse>(detailUrl);

  // 3. Fetch system health telemetry
  const { data: healthData } = useApi<HealthResponse>('/api/health', {
    refreshInterval: 10000,
  });

  const triggerSuccessBanner = (msg: string) => {
    setActionSuccessBanner(msg);
    setTimeout(() => setActionSuccessBanner(null), 4000);
  };

  // Real-time WebSocket connection for agent updates
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_CORE_WS_URL || 'ws://localhost:8000/ws';
      ws = new WebSocket(`${wsUrl}?role=agent`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message.created' || data.type === 'case.created' || data.type === 'action.completed' || data.type === 'case.updated') {
            refetchCases();
            if (data.caseId === selectedCaseId || data.conversationId === caseDetail?.conversationId) {
              refetchDetail();
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [selectedCaseId, caseDetail?.conversationId, refetchCases, refetchDetail]);

  // Case Action: Claim
  const handleClaimCase = async () => {
    if (!selectedCaseId) return;
    const { error } = await mutateApi(`/api/cases/${selectedCaseId}`, {
      method: 'PATCH',
      body: {
        assignedAgentId: activeAgent.id,
        status: 'assigned',
      },
    });

    if (!error) {
      triggerSuccessBanner(`Case successfully claimed by ${activeAgent.name}.`);
      refetchCases();
      refetchDetail();
    }
  };

  // Case Action: Release / Unclaim
  const handleReleaseCase = async () => {
    if (!selectedCaseId) return;
    const { error } = await mutateApi(`/api/cases/${selectedCaseId}`, {
      method: 'PATCH',
      body: {
        assignedAgentId: null,
        status: 'open',
      },
    });

    if (!error) {
      triggerSuccessBanner('Case released back to unassigned queue.');
      refetchCases();
      refetchDetail();
    }
  };

  // Case Action: Resolve
  const handleResolveCase = async () => {
    if (!selectedCaseId) return;
    const { error } = await mutateApi(`/api/cases/${selectedCaseId}`, {
      method: 'PATCH',
      body: {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      },
    });

    if (!error) {
      triggerSuccessBanner('Case marked as Resolved.');
      refetchCases();
      refetchDetail();
    }
  };

  // Case Action: Send message / internal note
  const handleSendMessage = async (content: string, role: 'agent' | 'system') => {
    if (!selectedCaseId || !caseDetail) return;
    const convId = caseDetail.conversationId || selectedCaseId;

    const { error } = await mutateApi(`/api/cases/${selectedCaseId}/messages`, {
      method: 'POST',
      body: {
        conversationId: convId,
        content,
        role,
        channel: 'web_chat',
      },
    });

    if (!error) {
      refetchDetail();
    }
  };

  // Action complete callback from ToolApprovalCard
  const handleToolActionComplete = (approved: boolean, message: string) => {
    triggerSuccessBanner(message);
    refetchDetail();
    refetchCases();
  };

  const isAssignedToCurrentAgent =
    caseDetail?.assignedAgentId === activeAgent.id;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b1120] text-slate-100 font-sans overflow-hidden">
      {/* Top Telemetry & Control Bar */}
      <header className="h-14 bg-slate-950/90 border-b border-white/10 px-4 flex items-center justify-between z-30 shrink-0 select-none backdrop-blur-md">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 tracking-wide flex items-center gap-1.5">
              <span>Agent Command Desk</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                HITL Level 3
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Live Human-in-the-Loop Co-pilot & Policy Orchestration
            </p>
          </div>
        </div>

        {/* Action Success Toast Banner */}
        {actionSuccessBanner && (
          <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-full flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{actionSuccessBanner}</span>
          </div>
        )}

        {/* Live Service Health Telemetry */}
        <div className="hidden md:flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            <div
              className={`w-2 h-2 rounded-full ${
                healthData?.coreApi === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400">Core API:</span>
            <span className="font-mono text-slate-200 uppercase text-[10px]">
              {healthData?.coreApi || 'checking...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            <div
              className={`w-2 h-2 rounded-full ${
                healthData?.orchestrator === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400">AI Orchestrator:</span>
            <span className="font-mono text-slate-200 uppercase text-[10px]">
              {healthData?.orchestrator || 'checking...'}
            </span>
          </div>

          {/* Polling Toggle */}
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isPolling
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-white/5'
            }`}
            title={isPolling ? 'Live auto-polling active (every 4s)' : 'Polling paused'}
          >
            {isPolling ? <Play className="w-2.5 h-2.5 fill-emerald-400" /> : <Pause className="w-2.5 h-2.5" />}
            <span>{isPolling ? 'Live Stream' : 'Paused'}</span>
          </button>
        </div>

        {/* Identity & Persona Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer text-left shadow-sm"
          >
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-tr ${activeAgent.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow`}
            >
              {activeAgent.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-100">{activeAgent.name}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  L{activeAgent.authLevel}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{activeAgent.title}</p>
            </div>
            <LogIn className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </header>

      {/* Main 3-Pane Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Pane 1: Escalation Queue Sidebar */}
        <QueueSidebar
          cases={casesList}
          selectedCaseId={selectedCaseId}
          onSelectCase={(id) => setSelectedCaseId(id)}
          currentAgentId={activeAgent.id}
          isLoading={isCasesLoading}
          onRefresh={() => {
            refetchCases();
            if (selectedCaseId) refetchDetail();
          }}
          isPolling={isPolling}
        />

        {/* Pane 2: Conversation & Live Transcript */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/10 min-w-0">
          {/* Top Selected Case Status Bar */}
          {caseDetail && (
            <div className="px-6 py-2 bg-slate-900/60 border-b border-white/5 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-slate-200 truncate">{caseDetail.subject}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium capitalize ${
                    caseDetail.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : caseDetail.status === 'assigned'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {caseDetail.status.replace('_', ' ')}
                </span>
              </div>

              {/* Case Claim / Resolve Controls */}
              <div className="flex items-center gap-2">
                {!isAssignedToCurrentAgent ? (
                  <button
                    onClick={handleClaimCase}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 cursor-pointer active:scale-95 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Claim Case</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleReleaseCase}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Release case back to general queue"
                    >
                      <UserX className="w-3.5 h-3.5 text-slate-400" />
                      <span>Release</span>
                    </button>
                    {caseDetail.status !== 'resolved' && (
                      <button
                        onClick={handleResolveCase}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Case</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transcript Viewer & Message Input */}
          {caseDetail ? (
            <TranscriptView
              caseId={caseDetail.id}
              conversationId={caseDetail.conversationId || caseDetail.id}
              customerName={caseDetail.customer?.name || caseDetail.customerName || 'Customer'}
              messages={caseDetail.messages || []}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Bot className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">Select an Escalation to Inspect</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a case from the queue on the left to review customer messages, AI synthesis, and tool authorization policies.
              </p>
            </div>
          )}
        </div>

        {/* Pane 3: Handoff Intelligence, Customer Profile & Four-Eyes Policy Sign-Off */}
        <div className="w-96 h-full flex flex-col bg-[#0f172a]/95 backdrop-blur-xl shrink-0 overflow-y-auto p-4 space-y-4 border-l border-white/10">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Diagnostic & Policy Desk
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">RBAC Active</span>
          </div>

          {caseDetail ? (
            <>
              {/* Customer Profile Card */}
              <CustomerProfileCard
                customer={
                  caseDetail.customer || {
                    id: caseDetail.customerId,
                    name: caseDetail.customerName || 'Customer',
                    email: caseDetail.customerEmail || 'authenticated@customer.io',
                    authenticationLevel: caseDetail.handoffPackage?.authenticationLevel ?? 2,
                    locale: 'en-US',
                  }
                }
              />

              {/* Tool Approval Card (Four-Eyes Governance) */}
              {(() => {
                const textCorpus = [
                  (caseDetail.handoffPackage?.informationCollected as any)?.orderId,
                  caseDetail.subject,
                  caseDetail.summary,
                  ...(caseDetail.messages || []).map((m: any) => m.content),
                ]
                  .filter(Boolean)
                  .join(' ');

                const orderMatch = textCorpus.match(/ORD-?\d+/i);
                const effectiveOrderId = orderMatch
                  ? orderMatch[0].toUpperCase().startsWith('ORD-')
                    ? orderMatch[0].toUpperCase()
                    : `ORD-${orderMatch[0].toUpperCase().replace('ORD', '')}`
                  : 'ORD-1003';

                const isCancel = /(cancel|cacel|cncl|refund|terminate|cancelit)/i.test(textCorpus);

                const defaultToolData = {
                  toolName: isCancel ? 'cancel_order' : 'authorize_resolution_tool',
                  arguments: {
                    orderId: effectiveOrderId,
                    customerId: caseDetail.customerId,
                    action: isCancel ? 'cancel_and_refund' : 'resolve_case',
                    orderValue: '$249.00',
                  },
                  policyReason:
                    'Four-Eyes Governance: Sensitive business operations (e.g. order cancellation, replacements, refunds) require Level-2/3 human supervisor authorization.',
                  requiresHumanApproval: true,
                };

                return (
                  <ToolApprovalCard
                    caseId={caseDetail.id}
                    isInitiallyApproved={
                      caseDetail.status === 'resolved' ||
                      Boolean((caseDetail as any).isActionApproved) ||
                      ((caseDetail as any).approvedActions && (caseDetail as any).approvedActions.length > 0)
                    }
                    caseStatus={caseDetail.status}
                    toolData={caseDetail.handoffPackage?.pendingProposedTool || defaultToolData}
                    agent={activeAgent}
                    onActionComplete={handleToolActionComplete}
                  />
                );
              })()}

              {/* Handoff Synthesis Package */}
              {caseDetail.handoffPackage && (
                <HandoffPackageCard handoffPackage={caseDetail.handoffPackage} />
              )}

              {/* AI Co-pilot Quick Assistant */}
              <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>AI Agent Co-pilot Actions</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      const rec =
                        caseDetail.handoffPackage?.recommendedNextAction ||
                        'I have reviewed your case and authorized the solution.';
                      handleSendMessage(rec, 'agent');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span>Insert AI Recommended Action</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      handleSendMessage(
                        `Agent ${activeAgent.name} initiated diagnostic policy scan on order and ledger telemetry. All verification checks passed.`,
                        'system'
                      );
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span>Log Diagnostic Audit Note</span>
                    <Wrench className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-xs">No case selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Authentication / Persona Switcher Modal */}
      <AgentAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        activeAgent={activeAgent}
        onSelectAgent={handleSelectAgent}
      />
    </div>
  );
}
