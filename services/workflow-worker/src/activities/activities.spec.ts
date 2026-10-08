import { describe, it, expect } from 'vitest';
import { fetchOrderDetails, sendNotification, recordWorkflowEvent } from './activities.js';

describe('Workflow Activities', () => {
  it('fetchOrderDetails returns fallback when service offline', async () => {
    const res = await fetchOrderDetails('ORD-12345', { integrationUrl: 'http://localhost:59999' });
    expect(res.orderId).toBe('ORD-12345');
    expect(res.status).toBe('delivered');
  });

  it('sendNotification returns delivery acknowledgment when service offline', async () => {
    const res = await sendNotification(
      {
        template: 'warranty-claim-created',
        recipient: { customerId: 'CUST-100' },
        variables: { claimId: 'WCL-789' },
      },
      { notificationUrl: 'http://localhost:59999' }
    );
    expect(res.status).toBe('delivered');
    expect(res.id).toContain('notif-mock-');
  });

  it('recordWorkflowEvent logs and succeeds', async () => {
    const res = await recordWorkflowEvent('wf-100', 'completed', { approved: true }, { coreApiUrl: 'http://localhost:59999' });
    expect(res).toBe(true);
  });
});
