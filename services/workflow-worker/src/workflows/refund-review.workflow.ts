/**
 * Refund Review Durable Workflow
 * Uses @temporalio/workflow to coordinate finance approvals and refund notification dispatch.
 */
import { proxyActivities, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities/activities.js';
import { approveSignal, rejectSignal, cancelSignal } from './warranty-claim.workflow.js';

const { fetchOrderDetails, sendNotification, recordWorkflowEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

export interface RefundReviewInput {
  workflowId: string;
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
  autoRefundLimit?: number;
}

export async function refundReviewWorkflow(input: RefundReviewInput): Promise<{ status: string; refundedAmount?: number; reason?: string }> {
  let isApproved = false;
  let isRejected = false;
  let rejectReason = 'Refund request rejected';

  setHandler(approveSignal, () => { isApproved = true; });
  setHandler(rejectSignal, (data) => {
    isRejected = true;
    if (data && typeof data.reason === 'string') rejectReason = data.reason;
  });
  setHandler(cancelSignal, () => { isRejected = true; rejectReason = 'Cancelled by customer or agent'; });

  // 1. Check order status
  await fetchOrderDetails(input.orderId);
  const autoLimit = input.autoRefundLimit ?? 100.0;

  // 2. Notify customer of refund review submission
  await sendNotification({
    template: 'refund-review',
    recipient: { customerId: input.customerId },
    variables: { orderId: input.orderId, amount: input.amount },
  });

  // 3. Evaluate approval policy
  if (input.amount > autoLimit) {
    await recordWorkflowEvent(input.workflowId, 'waiting_for_approval', { reason: `Refund amount $${input.amount} exceeds auto limit $${autoLimit}` });
    const resolved = await condition(() => isApproved || isRejected, '5 days');
    if (!resolved) {
      isRejected = true;
      rejectReason = 'Review window expired';
    }
  } else {
    isApproved = true;
  }

  // 4. Final resolution
  if (isApproved) {
    await sendNotification({
      template: 'refund-processed',
      recipient: { customerId: input.customerId },
      variables: { orderId: input.orderId, amount: input.amount },
    });
    await recordWorkflowEvent(input.workflowId, 'completed', { refundedAmount: input.amount });
    return { status: 'completed', refundedAmount: input.amount };
  } else {
    await recordWorkflowEvent(input.workflowId, 'cancelled', { reason: rejectReason });
    return { status: 'rejected', reason: rejectReason };
  }
}
