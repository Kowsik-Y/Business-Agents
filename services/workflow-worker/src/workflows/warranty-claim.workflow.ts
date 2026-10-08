/**
 * Warranty Claim Durable Workflow
 * Uses @temporalio/workflow for deterministic state transitions and human approval signals.
 */
import { proxyActivities, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities/activities.js';

const { fetchOrderDetails, sendNotification, recordWorkflowEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
});

export const approveSignal = defineSignal<[Record<string, unknown>?]>('approve');
export const rejectSignal = defineSignal<[Record<string, unknown>?]>('reject');
export const cancelSignal = defineSignal('cancel');

export interface WarrantyClaimInput {
  workflowId: string;
  orderId: string;
  customerId: string;
  itemId?: string;
  issueDescription: string;
  autoApproveThreshold?: number;
}

export async function warrantyClaimWorkflow(input: WarrantyClaimInput): Promise<{ status: string; labelUrl?: string; reason?: string }> {
  let isApproved = false;
  let isRejected = false;
  let rejectionReason = 'Cancelled or timed out';

  // Define signal handlers for human-in-the-loop escalation resolutions
  setHandler(approveSignal, () => {
    isApproved = true;
  });

  setHandler(rejectSignal, (data) => {
    isRejected = true;
    if (data && typeof data.reason === 'string') {
      rejectionReason = data.reason;
    }
  });

  setHandler(cancelSignal, () => {
    isRejected = true;
    rejectionReason = 'Workflow cancelled by admin';
  });

  // 1. Fetch original purchase order details
  const order = await fetchOrderDetails(input.orderId);
  const threshold = input.autoApproveThreshold ?? 300.0;

  // 2. Notify customer that warranty claim processing has started
  await sendNotification({
    template: 'warranty-claim-created',
    recipient: { customerId: input.customerId },
    variables: {
      claimId: input.workflowId,
      itemName: input.itemId || order.items[0]?.name || 'Purchased Device',
      nextStep: order.totalAmount <= threshold ? 'Automatic qualification checks' : 'Pending human representative review',
    },
  });

  // 3. Determine if human representative approval is required
  if (order.totalAmount > threshold) {
    await recordWorkflowEvent(input.workflowId, 'waiting_for_approval', { reason: `Order value $${order.totalAmount} exceeds auto threshold $${threshold}` });
    
    // Wait up to 7 days for human agent signal in Agent Console
    const isResolved = await condition(() => isApproved || isRejected, '7 days');
    if (!isResolved) {
      isRejected = true;
      rejectionReason = 'Exceeded 7-day representative review timeout';
    }
  } else {
    isApproved = true;
  }

  // 4. Execute post-resolution activities
  if (isApproved) {
    const labelUrl = `https://ship.csp.internal/labels/LABEL-${input.workflowId.substring(0, 8)}`;
    await sendNotification({
      template: 'warranty-claim-approved',
      recipient: { customerId: input.customerId },
      variables: { claimId: input.workflowId, labelUrl },
    });
    await recordWorkflowEvent(input.workflowId, 'completed', { approved: true, labelUrl });
    return { status: 'completed', labelUrl };
  } else {
    await sendNotification({
      template: 'warranty-claim-created',
      recipient: { customerId: input.customerId },
      variables: { claimId: input.workflowId, itemName: 'Claim Resolution', nextStep: `Claim not approved: ${rejectionReason}` },
    });
    await recordWorkflowEvent(input.workflowId, 'cancelled', { approved: false, reason: rejectionReason });
    return { status: 'rejected', reason: rejectionReason };
  }
}
