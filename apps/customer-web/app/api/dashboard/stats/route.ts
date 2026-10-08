import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';
const AI_ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8002';

interface CaseRow {
  id: string;
  status: string;
  priority: string;
  subject: string;
  summary?: string;
  assignedAgentId?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

export async function GET() {
  const results: {
    orchestrator: {
      status: string;
      requestsTotal: number;
      policyViolations: number;
    };
    tickets: {
      open: number;
      inProgress: number;
      resolved: number;
      requiresAction: number;
      total: number;
    };
    recentActivity: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: 'case' | 'system' | 'alert';
      status: string;
      priority: string;
    }>;
    _fallback: boolean;
  } = {
    orchestrator: { status: 'unknown', requestsTotal: 0, policyViolations: 0 },
    tickets: { open: 0, inProgress: 0, resolved: 0, requiresAction: 0, total: 0 },
    recentActivity: [],
    _fallback: false,
  };

  // 1. Orchestrator health
  try {
    const healthRes = await fetch(`${AI_ORCHESTRATOR_URL}/health/ready`, {
      signal: AbortSignal.timeout(3000),
    });
    if (healthRes.ok) {
      const health = await healthRes.json();
      results.orchestrator.status = health.status === 'ok' ? 'healthy' : 'degraded';
    }
  } catch {
    results.orchestrator.status = 'offline';
    results._fallback = true;
  }

  // 2. Orchestrator metrics
  try {
    const metricsRes = await fetch(`${AI_ORCHESTRATOR_URL}/health/metrics`, {
      signal: AbortSignal.timeout(3000),
    });
    if (metricsRes.ok) {
      const metricsText = await metricsRes.text();
      const requestsMatch = metricsText.match(/ai_orchestrator_requests_total\{[^}]*\}\s+(\d+)/);
      const violationsMatch = metricsText.match(/ai_policy_violations_total\{[^}]*\}\s+(\d+)/);
      if (requestsMatch) results.orchestrator.requestsTotal = parseInt(requestsMatch[1]!, 10);
      if (violationsMatch) results.orchestrator.policyViolations = parseInt(violationsMatch[1]!, 10);
    }
  } catch {
    // metrics unavailable, non-critical
  }

  // 3. Cases (tickets) summary
  try {
    const casesRes = await fetch(`${CORE_API_URL}/v1/cases?limit=50`, {
      signal: AbortSignal.timeout(5000),
    });
    if (casesRes.ok) {
      const casesList: CaseRow[] = await casesRes.json();
      results.tickets.total = casesList.length;
      for (const c of casesList) {
        const s = c.status?.toLowerCase();
        if (s === 'open') results.tickets.open++;
        else if (s === 'assigned' || s === 'in_progress') results.tickets.inProgress++;
        else if (s === 'resolved' || s === 'closed') results.tickets.resolved++;

        // Open + high/critical = requires action
        if ((s === 'open' || s === 'assigned') && (c.priority === 'high' || c.priority === 'critical')) {
          results.tickets.requiresAction++;
        }
      }

      // Build recent activity from latest 5 cases
      results.recentActivity = casesList.slice(0, 5).map((c) => ({
        id: c.id,
        title: c.subject || 'Untitled case',
        description: c.summary || c.subject || '',
        timestamp: c.createdAt,
        type: 'case' as const,
        status: c.status,
        priority: c.priority,
      }));
    }
  } catch {
    results._fallback = true;
  }

  return NextResponse.json(results);
}
