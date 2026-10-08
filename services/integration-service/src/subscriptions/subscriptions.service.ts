import { Injectable } from '@nestjs/common';

export interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  tier: 'VIP Platinum' | 'Gold Member' | 'Standard';
  status: 'active' | 'past_due' | 'cancelled';
  monthlyPrice: number;
  slaLevel: string;
  features: string[];
  renewsAt: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly subscriptions: SubscriptionDetails[] = [
    {
      subscriptionId: 'SUB-9001',
      customerId: 'CUST-1001',
      tier: 'VIP Platinum',
      status: 'active',
      monthlyPrice: 99,
      slaLevel: 'Zero-Latency SLA (15 min response guaranteed)',
      features: ['Dedicated Support Supervisor', 'Hardware Priority Dispatch', '24/7 AI Voice & Text'],
      renewsAt: '2026-09-01T00:00:00Z',
    },
    {
      subscriptionId: 'SUB-9002',
      customerId: 'CUST-1002',
      tier: 'Gold Member',
      status: 'active',
      monthlyPrice: 49,
      slaLevel: '24/7 Priority Queue (1 hour response)',
      features: ['24/7 AI Voice & Text Support', 'Advanced Network Telemetry Diagnostics'],
      renewsAt: '2026-08-28T00:00:00Z',
    },
  ];

  async getSubscriptionByCustomer(customerId: string): Promise<SubscriptionDetails> {
    const sub = this.subscriptions.find((s) => s.customerId === customerId);
    if (sub) return sub;

    // Default fallback subscription profile for demo / guest users
    return {
      subscriptionId: `SUB-${customerId.replace(/[^0-9]/g, '') || '1001'}`,
      customerId,
      tier: 'VIP Platinum',
      status: 'active',
      monthlyPrice: 99,
      slaLevel: 'Zero-Latency SLA',
      features: ['Dedicated Support Supervisor', 'Hardware Priority Dispatch', '24/7 AI Voice & Text'],
      renewsAt: '2026-09-01T00:00:00Z',
    };
  }
}
