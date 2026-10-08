/**
 * Order Processing Durable Workflow
 * Monitors shipment milestones and triggers automated customer delivery notifications.
 */
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/activities.js';

const { fetchOrderDetails, sendNotification, recordWorkflowEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

export interface OrderProcessingInput {
  workflowId: string;
  orderId: string;
  customerId: string;
  carrier?: string;
  trackingNumber?: string;
}

export async function orderProcessingWorkflow(input: OrderProcessingInput): Promise<{ status: string; trackingNumber: string }> {
  // 1. Validate order details via canonical Integration Service
  const order = await fetchOrderDetails(input.orderId);
  const trackingNumber = input.trackingNumber || `TRK-CSP-${Date.now()}`;
  const carrier = input.carrier || 'Global Express';

  // 2. Dispatch order shipped notification via Notification Service
  await sendNotification({
    template: 'order-shipped',
    recipient: { customerId: input.customerId || order.customerId },
    variables: {
      orderId: input.orderId,
      carrier,
      trackingNumber,
    },
  });

  // 3. Mark workflow completed in Core API
  await recordWorkflowEvent(input.workflowId, 'completed', { status: 'shipped', trackingNumber, carrier });

  return { status: 'completed', trackingNumber };
}
