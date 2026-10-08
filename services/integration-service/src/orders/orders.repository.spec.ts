import { describe, it, expect } from 'vitest';
import { OrdersRepository } from './orders.repository.js';

describe('OrdersRepository', () => {
  const repo = new OrdersRepository();

  it('returns ORD-1001 with shipped status and FedEx carrier', async () => {
    const order = await repo.findById('ORD-1001');
    expect(order).not.toBeNull();
    expect(order?.orderId).toBe('ORD-1001');
    expect(order?.status).toBe('shipped');
    expect(order?.carrier).toBe('FedEx');
    expect(order?.trackingNumber).toBe('TRK-987654321');
    expect(order?.estimatedDelivery).toBe('2026-08-10');
  });

  it('returns ORD-1002 with delivered status and UPS carrier', async () => {
    const order = await repo.findById('ORD-1002');
    expect(order).not.toBeNull();
    expect(order?.orderId).toBe('ORD-1002');
    expect(order?.status).toBe('delivered');
    expect(order?.carrier).toBe('UPS');
  });

  it('returns ORD-1003 with processing status', async () => {
    const order = await repo.findById('ORD-1003');
    expect(order).not.toBeNull();
    expect(order?.orderId).toBe('ORD-1003');
    expect(order?.status).toBe('processing');
  });

  it('returns null for unknown order ID', async () => {
    const order = await repo.findById('ORD-UNKNOWN-999');
    expect(order).toBeNull();
  });
});
