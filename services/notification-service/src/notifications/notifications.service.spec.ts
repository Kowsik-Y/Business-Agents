import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
  });

  it('should render and send a notification when template is found', async () => {
    const res = await service.sendNotification({
      channel: 'email',
      template: 'order-shipped',
      locale: 'en',
      recipient: { customerId: 'CUST-100', email: 'user@example.com' },
      variables: { orderId: 'ORD-1001', carrier: 'FedEx', trackingNumber: 'TRK-987654' },
    });

    expect(res.status).toBe('delivered');
    expect(res.renderedSubject).toBe('Your order ORD-1001 has shipped!');
    expect(res.renderedBody).toContain('on its way via FedEx. Tracking Number: TRK-987654');
  });

  it('should return cached record when idempotency key is repeated', async () => {
    const res1 = await service.sendNotification({
      channel: 'email',
      template: 'warranty-claim-created',
      locale: 'en',
      recipient: { customerId: 'CUST-200' },
      variables: { claimId: 'WCL-555', itemName: 'SmartHub 2', nextStep: 'Ship device' },
      idempotencyKey: 'wcl-555-init',
    });

    const res2 = await service.sendNotification({
      channel: 'email',
      template: 'warranty-claim-created',
      locale: 'en',
      recipient: { customerId: 'CUST-200' },
      variables: { claimId: 'WCL-555', itemName: 'SmartHub 2', nextStep: 'Ship device' },
      idempotencyKey: 'wcl-555-init',
    });

    expect(res1.id).toBe(res2.id);
  });

  it('should drop notification if recipient is on suppression list', async () => {
    const res = await service.sendNotification({
      channel: 'email',
      template: 'order-shipped',
      locale: 'en',
      recipient: { customerId: 'CUST-300', email: 'suppressed@example.com' },
      variables: { orderId: 'ORD-9999' },
    });

    expect(res.status).toBe('suppressed');
  });

  it('should throw BadRequestException if template does not exist', async () => {
    await expect(
      service.sendNotification({
        channel: 'email',
        template: 'unknown-template-xyz',
        locale: 'en',
        recipient: { customerId: 'CUST-100' },
        variables: {},
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should retrieve notification by ID', async () => {
    const created = await service.sendNotification({
      channel: 'email',
      template: 'human-handoff-notification',
      locale: 'en',
      recipient: { customerId: 'CUST-100' },
      variables: { caseId: 'CASE-888', waitTime: '2 mins' },
    });

    const fetched = await service.getNotification(created.id);
    expect(fetched.renderedSubject).toBe('Support Ticket #CASE-888 Escalated to Live Specialist');
  });

  it('should throw NotFoundException for non-existent ID', async () => {
    await expect(service.getNotification('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
