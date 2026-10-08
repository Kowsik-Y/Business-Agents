import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

/**
 * GET /api/tickets — list all cases from Core API, mapped to frontend ticket shape.
 * Supports optional ?status=open&priority=high query params.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const params = new URLSearchParams();
  params.set('limit', '50');
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);

  try {
    const res = await fetch(`${CORE_API_URL}/v1/cases?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ tickets: [], _fallback: true });
    }

    const cases = await res.json();

    // Map Core API case shape to frontend ticket shape
    const tickets = (cases as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      ticketNumber: `#${(c.id as string).substring(0, 8).toUpperCase()}`,
      title: (c.subject as string) || 'Untitled',
      description: (c.summary as string) || (c.subject as string) || '',
      client: (c.customerName as string) || 'Unknown Client',
      reportedBy: (c.customerName as string) || 'Unknown',
      reporterEmail: (c.customerEmail as string) || '',
      createdAt: c.createdAt as string,
      timeAgo: formatTimeAgo(c.createdAt as string),
      status: mapStatus(c.status as string),
      priority: mapPriority(c.priority as string),
      category: inferCategory(c.subject as string),
      assignee: (c.assignedAgentId as string) || 'Unassigned',
      slaRemaining: c.resolvedAt ? 'Completed' : calcSla(c.createdAt as string),
      aiSummary: (c.summary as string) || 'No AI diagnostic summary available for this case yet.',
      suggestedAction:
        ((c.escalation as Record<string, unknown>)?.recommendedNextAction as string) ||
        'Review case details and assist the customer.',
      conversationId: (c.conversationId as string) || '',
      messages: [],
    }));

    return NextResponse.json({ tickets, _fallback: false });
  } catch {
    return NextResponse.json({ tickets: [], _fallback: true });
  }
}

/**
 * POST /api/tickets — Create a new support ticket / case with an active conversation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId = 'CUST-1001',
      subject,
      summary,
      priority = 'medium',
      initialMessage,
      conversationId: passedConvId,
      orderId: passedOrderId,
      conversationHistory = [],
    } = body;

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // 1. Create or use existing Conversation in Core API
    let conversationId = passedConvId || `conv-${Date.now()}`;
    try {
      const convRes = await fetch(`${CORE_API_URL}/v1/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          customerId,
          channel: 'web_chat',
          subject,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (convRes.ok) {
        const convData = await convRes.json();
        conversationId = convData.id || conversationId;
      }
    } catch {
      // ignore
    }

    // 2. Post conversation history messages to Core API
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        try {
          await fetch(`${CORE_API_URL}/v1/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: msg.role === 'assistant' ? 'assistant' : 'customer',
              content: msg.content,
              channel: 'web_chat',
            }),
            signal: AbortSignal.timeout(2000),
          });
        } catch {
          // ignore
        }
      }
    } else if (initialMessage && conversationId) {
      try {
        await fetch(`${CORE_API_URL}/v1/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'customer',
            content: initialMessage,
            channel: 'web_chat',
          }),
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        // ignore
      }
    }

    // Extract Order ID dynamically
    const allText = [
      passedOrderId,
      subject,
      summary,
      initialMessage,
      ...(conversationHistory as Array<{ content: string }>).map((m) => m.content),
    ]
      .filter(Boolean)
      .join(' ');

    const orderMatch = allText.match(/ORD-?\d+/i);
    const extractedOrderId = orderMatch
      ? orderMatch[0].toUpperCase().startsWith('ORD-')
        ? orderMatch[0].toUpperCase()
        : `ORD-${orderMatch[0].toUpperCase().replace('ORD', '')}`
      : (passedOrderId || 'ORD-1003');

    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'high';

    // 3. Create Case in Core API
    const casePayload = {
      conversationId,
      customerId,
      subject,
      summary: summary || subject,
      priority: validPriority,
      handoffPackage: {
        conversationId,
        customerId,
        channel: 'web_chat',
        authenticationLevel: 1,
        activeIntent: subject.toLowerCase().includes('cancel') ? 'order_cancellation' : 'support_ticket',
        secondaryIntents: [],
        sentiment: 'neutral',
        riskLevel: validPriority === 'urgent' || validPriority === 'high' ? 'high' : 'low',
        summary: summary || subject,
        informationCollected: { orderId: extractedOrderId },
        missingInformation: [],
        actionsAttempted: [],
        retrievedSources: [],
        escalationReason: 'customer_request',
        recommendedNextAction: 'Review ticket details and confirm cancellation/order action.',
        pendingProposedTool: {
          toolName: subject.toLowerCase().includes('cancel') ? 'cancel_order' : 'authorize_resolution_tool',
          arguments: {
            orderId: extractedOrderId,
            customerId,
            action: subject.toLowerCase().includes('cancel') ? 'cancel_and_refund' : 'resolve_case',
            orderValue: '$249.00',
          },
          policyReason: 'Four-Eyes Governance: Sensitive business operations (e.g. order cancellation, replacements, refunds) require Level-2/3 human supervisor authorization.',
          requiresHumanApproval: true,
        },
      },
    };

    const caseRes = await fetch(`${CORE_API_URL}/v1/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(casePayload),
      signal: AbortSignal.timeout(5000),
    });

    if (caseRes.ok) {
      const createdCase = await caseRes.json();
      return NextResponse.json({
        id: createdCase.id,
        ticketNumber: `#${createdCase.id.substring(0, 8).toUpperCase()}`,
        conversationId,
        subject: createdCase.subject,
        status: createdCase.status,
        priority: createdCase.priority,
        _fallback: false,
      }, { status: 201 });
    }

    const errorJson = await caseRes.json().catch(() => ({}));
    return NextResponse.json({ error: 'Failed to create case in Core API', details: errorJson }, { status: caseRes.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function mapStatus(s: string): 'open' | 'in_progress' | 'resolved' | 'requires_action' {
  const lower = s?.toLowerCase() || 'open';
  if (lower === 'resolved' || lower === 'closed') return 'resolved';
  if (lower === 'assigned' || lower === 'in_progress') return 'in_progress';
  return 'open';
}

function mapPriority(p: string): 'high' | 'normal' | 'low' | 'urgent' {
  const lower = p?.toLowerCase() || 'medium';
  if (lower === 'critical') return 'urgent';
  if (lower === 'high') return 'high';
  if (lower === 'low') return 'low';
  return 'normal';
}

function inferCategory(subject: string): 'Tech' | 'Billing' | 'Logistics' | 'Integration' {
  const s = (subject || '').toLowerCase();
  if (s.includes('bill') || s.includes('invoice') || s.includes('payment') || s.includes('charge')) return 'Billing';
  if (s.includes('order') || s.includes('ship') || s.includes('deliver') || s.includes('track')) return 'Logistics';
  if (s.includes('api') || s.includes('integrat') || s.includes('connect') || s.includes('webhook')) return 'Integration';
  return 'Tech';
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

function calcSla(createdAt: string): string {
  try {
    const created = new Date(createdAt);
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24h SLA
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    if (remaining <= 0) return 'Overdue';
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  } catch {
    return 'N/A';
  }
}
