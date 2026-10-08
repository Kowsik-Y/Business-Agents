import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module.js';
import type { Database } from '../db/index.js';
import { workflowInstances } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '@csp/logger';

const logger = createLogger('core-api').child({ module: 'workflows' });

export interface StartWorkflowDto {
  workflowId: string;
  workflowType: string;
  caseId?: string;
  orderId?: string;
  input?: Record<string, unknown>;
}

export interface SignalWorkflowDto {
  signalName: 'approve' | 'reject' | 'request_more_information' | 'cancel';
  payload?: Record<string, unknown>;
}

@Injectable()
export class WorkflowsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  /** Start a durable business workflow and record its state in Postgres */
  async startWorkflow(dto: StartWorkflowDto) {
    logger.info('Starting workflow', {
      workflowId: dto.workflowId,
      type: dto.workflowType,
      caseId: dto.caseId,
    });

    // Check if workflow already exists (idempotence)
    const existing = await this.db
      .select()
      .from(workflowInstances)
      .where(eq(workflowInstances.workflowId, dto.workflowId));

    if (existing.length > 0) {
      logger.info('Returning existing workflow instance', { workflowId: dto.workflowId });
      return existing[0];
    }

    const initialStatus =
      dto.workflowType === 'RefundReviewWorkflow' || dto.workflowType === 'WarrantyClaimWorkflow'
        ? 'waiting_for_approval'
        : 'running';

    const [created] = await this.db
      .insert(workflowInstances)
      .values({
        workflowId: dto.workflowId,
        workflowType: dto.workflowType,
        caseId: dto.caseId || null,
        orderId: dto.orderId || null,
        status: initialStatus,
        input: dto.input || {},
        output: null,
      })
      .returning();

    // Try to notify workflow-worker via HTTP if online (non-blocking fallback)
    try {
      const workerUrl = process.env.WORKFLOW_WORKER_URL || 'http://localhost:8006';
      await fetch(`${workerUrl}/internal/v1/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: dto.workflowId,
          workflowType: dto.workflowType,
          input: dto.input,
        }),
      }).catch(() => {
        // Worker offline or testing mode; proceed cleanly
      });
    } catch {
      // Ignore network errors during offline unit tests
    }

    return created;
  }

  /** Send signal to active workflow instance */
  async sendSignal(workflowId: string, dto: SignalWorkflowDto) {
    logger.info('Sending signal to workflow', { workflowId, signal: dto.signalName });

    const [instance] = await this.db
      .select()
      .from(workflowInstances)
      .where(eq(workflowInstances.workflowId, workflowId));

    if (!instance) {
      throw new NotFoundException(`Workflow instance '${workflowId}' not found`);
    }

    let nextStatus = instance.status;
    let completedAt: Date | null = instance.completedAt;

    if (dto.signalName === 'approve') {
      nextStatus = 'completed';
      completedAt = new Date();
    } else if (dto.signalName === 'reject' || dto.signalName === 'cancel') {
      nextStatus = 'cancelled';
      completedAt = new Date();
    } else if (dto.signalName === 'request_more_information') {
      nextStatus = 'waiting_for_customer';
    }

    const [updated] = await this.db
      .update(workflowInstances)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
        completedAt,
        output: dto.payload || instance.output,
      })
      .where(eq(workflowInstances.workflowId, workflowId))
      .returning();

    // Try to send signal to workflow-worker if running
    try {
      const workerUrl = process.env.WORKFLOW_WORKER_URL || 'http://localhost:8006';
      await fetch(`${workerUrl}/internal/v1/workflows/${workflowId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalName: dto.signalName, payload: dto.payload }),
      }).catch(() => {
        // Worker offline or testing mode; proceed cleanly
      });
    } catch {
      // Ignore
    }

    return updated;
  }

  /** Retrieve workflow instance status by workflowId */
  async getWorkflow(workflowId: string) {
    const [instance] = await this.db
      .select()
      .from(workflowInstances)
      .where(eq(workflowInstances.workflowId, workflowId));

    if (!instance) {
      throw new NotFoundException(`Workflow instance '${workflowId}' not found`);
    }
    return instance;
  }

  /** Find active workflow by associated caseId */
  async findByCaseId(caseId: string) {
    const list = await this.db
      .select()
      .from(workflowInstances)
      .where(eq(workflowInstances.caseId, caseId));

    return list.length > 0 ? list[0] : null;
  }
}
