import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

/**
 * GET /api/tickets/[id] — fetch full case detail including messages, handoff, and escalation.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(`${CORE_API_URL}/v1/cases/${id}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Case not found', _fallback: true }, { status: 404 });
    }

    const caseDetail = (await res.json()) as Record<string, unknown>;

    // Map messages to frontend shape
    const rawMessages = (caseDetail.messages as Array<Record<string, unknown>>) || [];
    const messages = rawMessages.map((m) => ({
      id: m.id as string,
      sender: mapSenderName(m.role as string, caseDetail),
      role: mapRole(m.role as string),
      timestamp: formatTimestamp(m.createdAt as string),
      content: m.content as string,
      isAlert: (m.role as string) === 'system',
    }));

    // Extract handoff package for AI summary
    const handoff = caseDetail.handoffPackage as Record<string, unknown> | null;

    const ticket = {
      id: caseDetail.id as string,
      ticketNumber: `#${(caseDetail.id as string).substring(0, 8).toUpperCase()}`,
      title: (caseDetail.subject as string) || 'Untitled',
      description: (caseDetail.summary as string) || '',
      client: ((caseDetail.customer as Record<string, unknown>)?.name as string) || 'Unknown',
      reportedBy: ((caseDetail.customer as Record<string, unknown>)?.name as string) || 'Unknown',
      reporterEmail: ((caseDetail.customer as Record<string, unknown>)?.email as string) || '',
      createdAt: caseDetail.createdAt as string,
      status: caseDetail.status as string,
      priority: caseDetail.priority as string,
      assignee: (caseDetail.assignedAgentId as string) || 'Unassigned',
      slaRemaining: caseDetail.resolvedAt ? 'Completed' : 'Active',
      aiSummary: handoff
        ? (handoff.summary as string) || (caseDetail.summary as string) || ''
        : (caseDetail.summary as string) || '',
      suggestedAction: handoff
        ? (handoff.recommendedNextAction as string) || ''
        : '',
      escalationReason: handoff ? (handoff.escalationReason as string) : undefined,
      sentiment: handoff ? (handoff.sentiment as string) : undefined,
      riskLevel: handoff ? (handoff.riskLevel as string) : undefined,
      messages,
      _fallback: false,
    };

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch case', _fallback: true }, { status: 500 });
  }
}

/**
 * PATCH /api/tickets/[id] — update case (status, priority, assignedAgentId, summary).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const res = await fetch(`${CORE_API_URL}/v1/cases/${id}`, {
      method: 'PATCH',
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update case' },
      { status: 500 },
    );
  }
}

function mapRole(role: string): 'system' | 'client' | 'agent' {
  if (role === 'customer' || role === 'user') return 'client';
  if (role === 'assistant' || role === 'agent') return 'agent';
  return 'system';
}

function mapSenderName(role: string, caseDetail: Record<string, unknown>): string {
  if (role === 'customer' || role === 'user') {
    return ((caseDetail.customer as Record<string, unknown>)?.name as string) || 'Customer';
  }
  if (role === 'assistant' || role === 'agent') return 'Concierge AI';
  return 'System Alert';
}

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
