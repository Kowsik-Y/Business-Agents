import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const res = await fetch(`${CORE_API_URL}/v1/cases/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, _fallback: false });
      }
    } catch {
      // If backend is offline or fallback
    }

    // Realistic sample detail data for case
    const sampleDetails: Record<string, Record<string, unknown>> = {
      'case-esc-001': {
        id: 'case-esc-001',
        conversationId: 'conv-101',
        customerId: 'CUST-1001',
        customerName: 'Marcus Vance',
        customerEmail: 'marcus.v@enterprise.io',
        status: 'open',
        priority: 'urgent',
        subject: 'Damaged shipment & refund requested for Order #ORD-9982',
        summary: 'Customer received damaged package (MacBook Pro dock) and requested immediate replacement or refund.',
        customer: {
          id: 'CUST-1001',
          name: 'Marcus Vance',
          email: 'marcus.v@enterprise.io',
          authenticationLevel: 2,
          locale: 'en-US',
        },
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
            tracking: 'TRK-8821901',
          },
          missingInformation: ['Return tracking label acceptance'],
          actionsAttempted: ['get_order_status'],
          recommendedNextAction: 'Approve expedited replacement and email pre-paid return shipping label.',
        },
        handoffPackage: {
          conversationId: 'conv-101',
          caseId: 'case-esc-001',
          customerId: 'CUST-1001',
          customerName: 'Marcus Vance',
          customerEmail: 'marcus.v@enterprise.io',
          channel: 'web_chat',
          authenticationLevel: 2,
          activeIntent: 'refund_request',
          secondaryIntents: ['order_status', 'warranty_claim'],
          sentiment: 'frustrated',
          riskLevel: 'high',
          summary: 'Customer received damaged package (MacBook Pro dock) and requested immediate replacement or refund.',
          informationCollected: {
            orderId: 'ORD-9982',
            item: 'Thunderbolt 4 Dock Pro',
            amount: '$249.00',
            deliveredDate: '2026-08-04',
          },
          missingInformation: ['Confirm return shipping address'],
          actionsAttempted: ['get_order_status(ORD-9982)'],
          retrievedSources: ['KB-402: Hardware Replacement & Damage Claims', 'KB-108: Expedited Shipping Policies'],
          escalationReason: 'customer_request',
          recommendedNextAction: 'Authorize replacement order ($0) and issue pre-paid return label.',
          pendingProposedTool: {
            toolName: 'issue_replacement_order',
            arguments: {
              orderId: 'ORD-9982',
              itemId: 'ITM-9982-1',
              shippingSpeed: 'overnight',
              waiveFee: true,
            },
            policyReason: 'Tool requires human supervisor approval: Replacement value exceeds automatic bot limit ($100).',
            requiresHumanApproval: true,
          },
          createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        },
        messages: [
          {
            id: 'msg-1',
            role: 'customer',
            content: 'Hi, I received my package for order ORD-9982 this morning, but the dock is completely cracked and the box was crushed.',
            channel: 'web_chat',
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'I am very sorry to hear that your Thunderbolt 4 Dock Pro arrived damaged! Let me look up order ORD-9982 right away.',
            channel: 'web_chat',
            createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-3',
            role: 'assistant',
            content: 'I verified your order was delivered yesterday via FedEx. Because this item is $249, I am connecting you directly with our Customer Success representative who can approve an immediate replacement and send a pre-paid return label.',
            channel: 'web_chat',
            createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-4',
            role: 'customer',
            content: 'Thank you. I really need this dock for my work setup by tomorrow if possible.',
            channel: 'web_chat',
            createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
      'case-esc-002': {
        id: 'case-esc-002',
        conversationId: 'conv-102',
        customerId: 'CUST-1002',
        customerName: 'Elena Rostova',
        customerEmail: 'elena.r@fintech.co',
        status: 'assigned',
        assignedAgentId: 'AGT-104',
        priority: 'high',
        subject: 'Voice Call Escalation — Subscription Tier Upgrade Dispute',
        summary: 'Customer called about unexpected enterprise annual billing renewal charge.',
        customer: {
          id: 'CUST-1002',
          name: 'Elena Rostova',
          email: 'elena.r@fintech.co',
          authenticationLevel: 3,
          locale: 'en-US',
        },
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
        },
        handoffPackage: {
          conversationId: 'conv-102',
          caseId: 'case-esc-002',
          customerId: 'CUST-1002',
          customerName: 'Elena Rostova',
          customerEmail: 'elena.r@fintech.co',
          channel: 'voice',
          authenticationLevel: 3,
          activeIntent: 'billing_inquiry',
          secondaryIntents: ['dispute_charge'],
          sentiment: 'angry',
          riskLevel: 'critical',
          summary: 'Customer called disputing automatic $1,200 annual subscription renewal.',
          informationCollected: {
            subscriptionId: 'SUB-4412',
            plan: 'Enterprise Annual',
            amount: '$1,200.00',
          },
          missingInformation: [],
          actionsAttempted: ['get_subscription_details(SUB-4412)'],
          retrievedSources: ['KB-901: Enterprise Subscription Terms & Renewal Windows'],
          escalationReason: 'high_risk_action',
          recommendedNextAction: 'Review renewal contract dates and discuss plan adjustment options.',
          pendingProposedTool: {
            toolName: 'apply_billing_adjustment',
            arguments: {
              subscriptionId: 'SUB-4412',
              adjustmentType: 'loyalty_discount_credit',
              percentage: 20,
              amount: 240.0,
            },
            policyReason: 'Four-Eyes Policy: Billing adjustments exceeding $100 require supervisor sign-off.',
            requiresHumanApproval: true,
          },
          createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        },
        messages: [
          {
            id: 'msg-v1',
            role: 'customer',
            content: '[Voice Transmit] Hello, I see an automatic charge of $1,200 for enterprise renewal, but we wanted to switch our seat tier.',
            channel: 'voice',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-v2',
            role: 'assistant',
            content: 'I understand, Elena. Let me pull up your enterprise contract SUB-4412. I see the auto-renew took place on August 1st.',
            channel: 'voice',
            createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-v3',
            role: 'assistant',
            content: 'Since plan adjustments on active billing cycles require supervisor authorization, I have routed this call to our Senior Success Desk with your contract details ready.',
            channel: 'voice',
            createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    };

    const caseData = sampleDetails[id] || {
      id,
      conversationId: `conv-${id}`,
      customerId: 'CUST-1001',
      customerName: 'Customer',
      status: 'open',
      priority: 'medium',
      subject: 'Escalated Customer Support Inquiry',
      summary: 'Customer reached out and requested assistance.',
      customer: {
        id: 'CUST-1001',
        name: 'Customer',
        email: 'customer@enterprise.io',
        authenticationLevel: 1,
        locale: 'en-US',
      },
      handoffPackage: {
        conversationId: `conv-${id}`,
        caseId: id,
        customerId: 'CUST-1001',
        channel: 'web_chat',
        authenticationLevel: 1,
        activeIntent: 'support_inquiry',
        secondaryIntents: [],
        sentiment: 'neutral',
        riskLevel: 'low',
        summary: 'Customer reached out and requested assistance.',
        informationCollected: {},
        missingInformation: [],
        actionsAttempted: [],
        retrievedSources: [],
        escalationReason: 'customer_request',
        recommendedNextAction: 'Review inquiry and respond.',
      },
      messages: [
        {
          id: 'msg-01',
          role: 'customer',
          content: 'Hello, I have an issue with my order.',
          channel: 'web_chat',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _fallback: true,
    };

    return NextResponse.json(caseData);
  } catch (err) {
    console.error('GET /api/cases/[id] error:', err);
    return NextResponse.json({ error: 'Failed to retrieve case' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    try {
      const res = await fetch(`${CORE_API_URL}/v1/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, _fallback: false });
      }
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    } catch {
      // Fallback response for offline development
      return NextResponse.json({ id, ...body, updatedAt: new Date().toISOString(), _fallback: true });
    }
  } catch (err) {
    console.error('PATCH /api/cases/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}
