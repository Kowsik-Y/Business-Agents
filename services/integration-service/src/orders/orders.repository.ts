/**
 * Mock Order Repository
 * Supplies realistic order data for integration testing and AI workflow verification.
 * @see docs/11-integration-service.md, docs/implementation-plan.md
 */
import { Injectable } from '@nestjs/common';
import type { OrderStatus } from '@csp/contracts';

@Injectable()
export class OrdersRepository {
  // Map customer IDs to their associated order IDs
  private readonly customerOrders: Map<string, string[]> = new Map([
    ['CUST-1001', ['ORD-1001', 'ORD-1003']],
    ['CUST-1002', ['ORD-1002']],
    ['CUST-2026', ['ORD-2026']],
  ]);

  private readonly orders: Map<string, OrderStatus> = new Map([
    [
      'ORD-1001',
      {
        orderId: 'ORD-1001',
        status: 'shipped',
        carrier: 'FedEx',
        trackingNumber: 'TRK-987654321',
        estimatedDelivery: '2026-08-10',
        shippedAt: '2026-08-04T10:00:00.000Z',
      },
    ],
    [
      'ORD-1002',
      {
        orderId: 'ORD-1002',
        status: 'delivered',
        carrier: 'UPS',
        trackingNumber: '1Z9999999999999999',
        deliveredAt: '2026-08-01T14:30:00.000Z',
      },
    ],
    [
      'ORD-1003',
      {
        orderId: 'ORD-1003',
        status: 'processing',
        estimatedDelivery: '2026-08-15',
      },
    ],
  ]);

  /** Find order by ID */
  async findById(orderId: string): Promise<OrderStatus | null> {
    const existing = this.orders.get(orderId);
    if (existing) return existing;

    // Dynamically generate user-based order response for standard numeric order IDs (e.g., ORD-2026, ORD-5432)
    if (/^ORD-?\d+$/i.test(orderId)) {
      const formattedId = orderId.toUpperCase().startsWith('ORD-')
        ? orderId.toUpperCase()
        : `ORD-${orderId.toUpperCase().replace('ORD', '')}`;
      
      const existingFormatted = this.orders.get(formattedId);
      if (existingFormatted) return existingFormatted;

      const statuses: Array<'shipped' | 'delivered' | 'processing'> = ['shipped', 'delivered', 'processing'];
      const carriers = ['FedEx', 'UPS', 'DHL Express', 'USPS Priority'];

      let hash = 0;
      for (let i = 0; i < formattedId.length; i++) {
        hash = (hash * 31 + formattedId.charCodeAt(i)) & 0xffffffff;
      }
      const absHash = Math.abs(hash);

      const status = statuses[absHash % statuses.length]!;
      const carrier = carriers[absHash % carriers.length]!;
      const trackingNumber = `${carrier.substring(0, 3).toUpperCase()}-${(absHash * 1234567).toString().substring(0, 10).padEnd(10, '8')}`;

      const now = new Date();
      const generatedOrder: OrderStatus = {
        orderId: formattedId,
        status,
        carrier,
        trackingNumber,
        estimatedDelivery: status === 'delivered' ? undefined : new Date(now.getTime() + ((absHash % 5) + 2) * 86400000).toISOString().split('T')[0],
        shippedAt: status !== 'processing' ? new Date(now.getTime() - ((absHash % 3) + 1) * 86400000).toISOString() : undefined,
        deliveredAt: status === 'delivered' ? new Date(now.getTime() - 3600000).toISOString() : undefined,
      };

      this.orders.set(formattedId, generatedOrder);
      return generatedOrder;
    }

    return null;
  }

  /** Find all orders for a given customer ID */
  async findByCustomerId(customerId: string): Promise<OrderStatus[]> {
    const orderIds = this.customerOrders.get(customerId) || [];
    const results: OrderStatus[] = [];
    for (const orderId of orderIds) {
      const order = await this.findById(orderId);
      if (order) results.push(order);
    }
    // If no mapped orders but customer exists, generate a sample order
    if (results.length === 0 && customerId.startsWith('CUST-')) {
      const syntheticOrderId = `ORD-${customerId.replace('CUST-', '')}`;
      const order = await this.findById(syntheticOrderId);
      if (order) {
        this.customerOrders.set(customerId, [syntheticOrderId]);
        results.push(order);
      }
    }
    return results;
  }

  /** Cancel an order by ID */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderStatus> {
    const existing = await this.findById(orderId);
    const updated: OrderStatus = {
      orderId: orderId.toUpperCase(),
      status: 'cancelled',
      carrier: existing?.carrier,
      trackingNumber: existing?.trackingNumber,
      estimatedDelivery: undefined,
      shippedAt: existing?.shippedAt,
      deliveredAt: undefined,
    };
    this.orders.set(orderId.toUpperCase(), updated);
    return updated;
  }
}
