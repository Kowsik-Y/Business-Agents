import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowRunnerService } from './workflow-runner.service.js';
import { NotFoundException } from '@nestjs/common';

describe('WorkflowRunnerService', () => {
  let runner: WorkflowRunnerService;

  beforeEach(async () => {
    runner = new WorkflowRunnerService();
    await runner.onModuleInit();
  });

  it('executes WarrantyClaimWorkflow and transitions to waiting_for_approval when amount exceeds threshold', async () => {
    const exec = await runner.executeWorkflow({
      workflowId: 'wcl-101',
      workflowType: 'WarrantyClaimWorkflow',
      input: { orderId: 'ORD-HIGH', autoApproveThreshold: 100.0, customerId: 'CUST-1' },
    });

    // Since our fallback order totalAmount is 450, it exceeds 100
    expect(exec.status).toBe('waiting_for_approval');
  });

  it('completes WarrantyClaimWorkflow on approve signal with generated prepaid label URL', async () => {
    await runner.executeWorkflow({
      workflowId: 'wcl-102',
      workflowType: 'WarrantyClaimWorkflow',
      input: { orderId: 'ORD-200', autoApproveThreshold: 100.0 },
    });

    const sigRes = await runner.sendSignal('wcl-102', { signalName: 'approve' });
    expect(sigRes.status).toBe('completed');
    expect(sigRes.output?.labelUrl).toBeDefined();
    expect(String(sigRes.output?.labelUrl)).toContain('https://ship.csp.internal/labels/');
  });

  it('rejects RefundReviewWorkflow when reject signal is sent', async () => {
    await runner.executeWorkflow({
      workflowId: 'ref-500',
      workflowType: 'RefundReviewWorkflow',
      input: { orderId: 'ORD-300', amount: 350.0, autoRefundLimit: 100.0 },
    });

    const res = await runner.sendSignal('ref-500', {
      signalName: 'reject',
      payload: { reason: 'Policy exclusion period reached' },
    });

    expect(res.status).toBe('rejected');
    expect(res.output?.reason).toBe('Policy exclusion period reached');
  });

  it('executes OrderProcessingWorkflow to instant completion', async () => {
    const exec = await runner.executeWorkflow({
      workflowId: 'ord-proc-99',
      workflowType: 'OrderProcessingWorkflow',
      input: { orderId: 'ORD-999', customerId: 'CUST-99' },
    });

    expect(exec.status).toBe('completed');
    expect(exec.output?.trackingNumber).toContain('TRK-CSP-');
  });

  it('throws NotFoundException on signal or status check for non-existent execution ID', async () => {
    await expect(runner.getStatus('missing-id')).rejects.toThrow(NotFoundException);
    await expect(runner.sendSignal('missing-id', { signalName: 'approve' })).rejects.toThrow(NotFoundException);
  });
});
