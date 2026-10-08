import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();

  try {
    const res = await fetch(`${CORE_API_URL}/v1/cases${queryString ? `?${queryString}` : ''}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ cases: Array.isArray(data) ? data : [], _fallback: false });
    }
  } catch {
    // Backend offline fallback
  }

  // Realistic sample active handoff cases for offline testing and preview
  const fallbackCases = [
    {
      id: 'case-esc-001',
      conversationId: 'conv-101',
      customerId: 'CUST-1001',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@enterprise.io',
      status: 'open',
      priority: 'urgent',
      subject: 'Damaged shipment & refund requested for Order #ORD-9982',
      summary: 'Customer received damaged package (MacBook Pro dock) and requested immediate replacement or refund.',
      escalation: {
        id: 'esc-101',
        reason: 'customer_request',
        summary: 'Customer received damaged goods, AI cannot issue refund over $100 without human approval.',
        activeIntent: 'refund_request',
        sentiment: 'frustrated',
        riskLevel: 'high',
        informationCollected: {
          orderId: 'ORD-9982',
          item: 'Thunderbolt 4 Dock Pro',
          amount: '$249.00',
        },
        missingInformation: ['Return tracking label acceptance'],
        actionsAttempted: ['get_order_status'],
        recommendedNextAction: 'Approve expedited replacement and email pre-paid return shipping label.',
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
    {
      id: 'case-esc-002',
      conversationId: 'conv-102',
      customerId: 'CUST-1002',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.r@fintech.co',
      status: 'assigned',
      assignedAgentId: 'AGT-001',
      priority: 'high',
      subject: 'Voice Call Escalation — Subscription Tier Upgrade Dispute',
      summary: 'Customer called about unexpected enterprise annual billing renewal charge.',
      escalation: {
        id: 'esc-102',
        reason: 'high_risk_action',
        summary: 'Invoice dispute on auto-renew subscription ($1,200).',
        activeIntent: 'billing_inquiry',
        sentiment: 'angry',
        riskLevel: 'critical',
        informationCollected: {
          subscriptionId: 'SUB-4412',
          plan: 'Enterprise Annual',
          renewalDate: '2026-08-01',
        },
        missingInformation: [],
        actionsAttempted: ['get_subscription_details'],
        recommendedNextAction: 'Apply 20% loyalty retention credit or adjust contract terms.',
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'case-esc-003',
      conversationId: 'conv-103',
      customerId: 'CUST-1003',
      customerName: 'David Chen',
      customerEmail: 'dchen@techstart.ai',
      status: 'open',
      priority: 'medium',
      subject: 'Delayed delivery for international order #ORD-7714',
      summary: 'Customs clearance delay for EU shipment; customer requested status update from representative.',
      escalation: {
        id: 'esc-103',
        reason: 'customer_request',
        summary: 'Customer requested human confirmation on customs clearance ETA.',
        activeIntent: 'order_tracking',
        sentiment: 'neutral',
        riskLevel: 'low',
        informationCollected: {
          orderId: 'ORD-7714',
          destination: 'Berlin, Germany',
          customsStatus: 'Pending Inspection',
        },
        missingInformation: [],
        actionsAttempted: ['track_shipment'],
        recommendedNextAction: 'Provide customs release ETA and offer expedited courier upgrade if delayed past 48 hours.',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ];

  return NextResponse.json({ cases: fallbackCases, _fallback: true });
}
