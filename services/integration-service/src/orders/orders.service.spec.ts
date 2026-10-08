import { describe, it, expect } from 'vitest';
import { OrdersService } from './orders.service.js';
import { OrdersRepository } from './orders.repository.js';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  const repo = new OrdersRepository();
  const service = new OrdersService(repo);

  it('retrieves order when orderId exists', async () => {
    const order = await service.getOrder('ORD-1001');
    expect(order.orderId).toBe('ORD-1001');
    expect(order.carrier).toBe('FedEx');
  });

  it('throws NotFoundException when orderId does not exist', async () => {
    await expect(service.getOrder('UNKNOWN-ORD')).rejects.toThrow(NotFoundException);
  });
});
