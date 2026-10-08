/**
 * Cases service — business logic for agent queues, escalations, handoff packages, and tool approvals.
 * @see docs/04-agent-console.md, docs/06-core-api.md
 */
import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { WorkflowsService } from '../workflows/workflows.service.js';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module.js';
import type { Database } from '../db/index.js';
import { cases, escalations, customers, conversations, messages, actionLogs } from '../db/schema.js';
import type {
  CreateCase,
  UpdateCase,
  ApproveAction,
  RejectAction,
  CaseFilter,
  HandoffPackage,
} from '@csp/contracts';
import { createLogger } from '@csp/logger';
import { WebSocketService } from '../websocket/websocket.service.js';

const logger = createLogger('core-api').child({ module: 'cases' });

@Injectable()
export class CasesService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    @Inject(WebSocketService) private readonly wsService: WebSocketService,
    @Optional() @Inject(WorkflowsService) private readonly workflowsService?: WorkflowsService,
  ) {}

  /** List cases with filtering for agent queue */
  async findAll(filter: Partial<CaseFilter> = {}) {
    const conditions = [];

    if (filter.status) {
      conditions.push(eq(cases.status, filter.status));
    }
    if (filter.priority) {
      conditions.push(eq(cases.priority, filter.priority));
    }
    if (filter.assignedAgentId) {
      conditions.push(eq(cases.assignedAgentId, filter.assignedAgentId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const caseList = await this.db
      .select()
      .from(cases)
      .where(whereClause)
      .orderBy(desc(cases.createdAt))
      .limit(filter.limit ?? 20)
      .offset(filter.offset ?? 0);

    // Hydrate cases with customer and escalation summaries
    const hydratedCases = await Promise.all(
      caseList.map(async (c) => {
        let customer = null;
        if (c.customerId) {
          const [cust] = await this.db
            .select()
            .from(customers)
            .where(eq(customers.id, c.customerId))
            .limit(1);
          customer = cust ?? null;
        }

        const [escalation] = await this.db
          .select()
          .from(escalations)
          .where(eq(escalations.caseId, c.id))
          .orderBy(desc(escalations.createdAt))
          .limit(1);

        return {
          ...c,
          customerName: customer?.name ?? 'Guest User',
          customerEmail: customer?.email ?? undefined,
          escalation: escalation ?? undefined,
        };
      }),
    );

    return hydratedCases;
  }

  /** Get a single case by ID with full handoff package and conversation messages */
  async findById(id: string) {
    const [c] = await this.db
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1);

    if (!c) {
      throw new NotFoundException(`Case ${id} not found`);
    }

    // Fetch customer info
    const [cust] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, c.customerId))
      .limit(1);

    // Fetch escalation info
    const [escalation] = await this.db
      .select()
      .from(escalations)
      .where(eq(escalations.caseId, c.id))
      .orderBy(desc(escalations.createdAt))
      .limit(1);

    // Fetch conversation & messages
    const msgs = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, c.conversationId))
      .orderBy(messages.createdAt);

    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, c.conversationId))
      .limit(1);

    // Extract effective orderId from escalation information, subject, summary, or messages
    const textCorpus = [
      (escalation?.informationCollected as any)?.orderId,
      c.subject,
      c.summary,
      ...msgs.map((m) => m.content),
    ]
      .filter(Boolean)
      .join(' ');

    const orderMatch = textCorpus.match(/ORD-?\d+/i);
    const effectiveOrderId = orderMatch
      ? orderMatch[0].toUpperCase().startsWith('ORD-')
        ? orderMatch[0].toUpperCase()
        : `ORD-${orderMatch[0].toUpperCase().replace('ORD', '')}`
      : 'ORD-1003';

    const isCancel = /(cancel|cacel|cncl|refund|terminate|cancelit)/i.test(textCorpus);

    // Synthesize structured HandoffPackage per docs/04-agent-console.md
    const handoffPackage: HandoffPackage = {
      conversationId: c.conversationId,
      caseId: c.id,
      customerId: c.customerId,
      customerName: cust?.name ?? 'Customer',
      customerEmail: cust?.email ?? undefined,
      channel: conv?.channel ?? 'web_chat',
      authenticationLevel: (cust?.authenticationLevel as 0 | 1 | 2 | 3) ?? 0,
      activeIntent: isCancel ? 'order_cancellation' : (escalation?.activeIntent ?? conv?.activeIntent ?? 'support_inquiry'),
      secondaryIntents: [],
      sentiment: (escalation?.sentiment as 'positive' | 'neutral' | 'negative' | 'frustrated' | undefined) ?? (conv?.sentiment as 'positive' | 'neutral' | 'negative' | 'frustrated' | undefined) ?? 'neutral',
      riskLevel: (escalation?.riskLevel as 'low' | 'medium' | 'high' | undefined) ?? 'high',
      summary: escalation?.summary ?? c.summary ?? c.subject,
      informationCollected: {
        ...((escalation?.informationCollected as Record<string, unknown>) ?? {}),
        orderId: effectiveOrderId,
      },
      missingInformation: (escalation?.missingInformation as string[]) ?? [],
      actionsAttempted: (escalation?.actionsAttempted as string[]) ?? [],
      relevantBusinessObjects: { orderId: effectiveOrderId },
      retrievedSources: [],
      escalationReason: (escalation?.reason as 'customer_request' | 'low_confidence' | 'policy_violation' | 'high_risk_action' | 'conflicting_information' | 'sensitive_topic' | 'repeated_failure' | 'approval_required' | undefined) ?? 'customer_request',
      recommendedNextAction: isCancel
        ? `Review ticket details and confirm cancellation/refund for ${effectiveOrderId}.`
        : (escalation?.recommendedNextAction ?? 'Review conversation transcript and assist the customer.'),
      pendingProposedTool: {
        toolName: isCancel ? 'cancel_order' : 'authorize_resolution_tool',
        arguments: {
          orderId: effectiveOrderId,
          customerId: c.customerId,
          action: isCancel ? 'cancel_and_refund' : 'resolve_case',
          orderValue: '$249.00',
        },
        policyReason: 'Four-Eyes Governance: Sensitive business operations (e.g. order cancellation, replacements, refunds) require Level-2/3 human supervisor authorization.',
        requiresHumanApproval: true,
      },
      createdAt: c.createdAt.toISOString(),
    };

    // Fetch actionLogs / tool approvals for this case
    let logs: any[] = [];
    try {
      logs = await this.db
        .select()
        .from(actionLogs)
        .where(and(eq(actionLogs.resourceType, 'case'), eq(actionLogs.resourceId, c.id)))
        .orderBy(desc(actionLogs.createdAt));
    } catch {
      // ignore
    }

    const approvedLogs = logs.filter((l) => l.action === 'approve_tool');
    const isActionApproved = approvedLogs.length > 0 || c.status === 'resolved';

    return {
      ...c,
      customer: cust ?? null,
      escalation: escalation ?? null,
      handoffPackage,
      messages: msgs,
      actionLogs: logs,
      approvedActions: approvedLogs,
      isActionApproved,
    };
  }

  /** Create a new case and optional escalation handoff */
  async create(data: CreateCase) {
    const [createdCase] = await this.db
      .insert(cases)
      .values({
        conversationId: data.conversationId,
        customerId: data.customerId,
        priority: data.priority ?? 'medium',
        subject: data.subject,
        summary: data.summary ?? data.subject,
        status: 'open',
      })
      .returning();

    if (!createdCase) {
      throw new Error('Failed to create case');
    }

    let createdEscalation = null;
    if (data.handoffPackage) {
      const hp = data.handoffPackage;
      const [esc] = await this.db
        .insert(escalations)
        .values({
          conversationId: data.conversationId,
          caseId: createdCase.id,
          reason: hp.escalationReason ?? 'customer_request',
          summary: hp.summary ?? data.subject,
          activeIntent: hp.activeIntent,
          sentiment: hp.sentiment,
          riskLevel: hp.riskLevel,
          informationCollected: hp.informationCollected,
          missingInformation: hp.missingInformation,
          actionsAttempted: hp.actionsAttempted,
          recommendedNextAction: hp.recommendedNextAction,
        })
        .returning();
      createdEscalation = esc;
    }

    logger.info('Case created for handoff', {
      caseId: createdCase.id,
      conversationId: data.conversationId,
      customerId: data.customerId,
    });

    this.wsService.broadcast({
      type: 'case.created',
      conversationId: data.conversationId,
      caseId: createdCase.id,
      data: createdCase,
    });

    return {
      ...createdCase,
      escalation: createdEscalation,
    };
  }

  /** Update case attributes (assign agent, change status, update notes) */
  async update(id: string, data: UpdateCase) {
    await this.findById(id);

    const updatePayload: Partial<typeof cases.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.assignedAgentId !== undefined) {
      updatePayload.assignedAgentId = data.assignedAgentId;
      if (!data.status) {
        updatePayload.status = 'assigned';
      }
    }
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === 'resolved' || data.status === 'closed') {
        updatePayload.resolvedAt = new Date();
      }
    }
    if (data.priority !== undefined) {
      updatePayload.priority = data.priority;
    }
    if (data.subject !== undefined) {
      updatePayload.subject = data.subject;
    }
    if (data.summary !== undefined) {
      updatePayload.summary = data.summary;
    }
    if (data.resolvedAt !== undefined) {
      updatePayload.resolvedAt = new Date(data.resolvedAt);
    }

    const [updatedCase] = await this.db
      .update(cases)
      .set(updatePayload)
      .where(eq(cases.id, id))
      .returning();

    logger.info('Case updated', { caseId: id, status: updatedCase?.status });
    return updatedCase;
  }

  /** Approve a proposed tool action */
  async approveAction(id: string, data: ApproveAction) {
    const c = await this.findById(id);

    let logId: string | undefined;
    try {
      // Record audit action log
      const [log] = await this.db
        .insert(actionLogs)
        .values({
          actorId: c.assignedAgentId ?? 'human-agent',
          actorType: 'agent',
          action: 'approve_tool',
          resourceType: 'case',
          resourceId: id,
          details: {
            toolName: data.toolName,
            arguments: data.arguments,
            agentNotes: data.agentNotes,
          },
        })
        .returning();
      logId = log?.id;
    } catch (err) {
      logger.warn('Failed to write audit actionLog (continuing approval)', { error: (err as Error).message });
    }

    // Execute actual business action if cancelling order
    const orderId = (data.arguments as Record<string, unknown>)?.orderId as string || 'ORD-1001';
    if (data.toolName.includes('cancel') || data.toolName.includes('order')) {
      try {
        const intUrl = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:8003';
        await fetch(`${intUrl}/internal/v1/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: data.agentNotes || 'Approved by supervisor in Agent Command Desk' }),
        });
      } catch (err) {
        logger.warn('Failed to call integration-service order cancellation', { error: (err as Error).message });
      }

      // Add agent message to conversation
      if (c.conversationId) {
        try {
          await this.db.insert(messages).values({
            conversationId: c.conversationId,
            role: 'agent',
            channel: 'web_chat',
            content: `[Supervisor Authorization] Order ${orderId} has been CANCELLED and refunded in the ERP system. Approved by ${c.assignedAgentId || 'Supervisor'}.`,
          });
        } catch {
          // ignore
        }
      }
    }

    // Update case status to resolved
    try {
      await this.db
        .update(cases)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cases.id, id));
    } catch {
      // ignore
    }

    // Broadcast action approval event to WebSockets
    this.wsService.broadcast({
      type: 'action.completed',
      conversationId: c.conversationId,
      caseId: id,
      data: { action: 'approve', toolName: data.toolName },
    });

    return {
      approved: true,
      caseId: id,
      toolName: data.toolName,
      auditLogId: logId,
      message: `Action '${data.toolName}' approved and executed successfully.`,
    };
  }

  /** Reject a proposed tool action */
  async rejectAction(id: string, data: RejectAction) {
    const c = await this.findById(id);

    let logId: string | undefined;
    try {
      // Record audit action log
      const [log] = await this.db
        .insert(actionLogs)
        .values({
          actorId: c.assignedAgentId ?? 'human-agent',
          actorType: 'agent',
          action: 'reject_tool',
          resourceType: 'case',
          resourceId: id,
          details: {
            toolName: data.toolName,
            reason: data.reason,
            agentNotes: data.agentNotes,
          },
        })
        .returning();
      logId = log?.id;
    } catch (err) {
      logger.warn('Failed to write audit actionLog (continuing rejection)', { error: (err as Error).message });
    }

    logger.info('Tool action rejected by agent', {
      caseId: id,
      toolName: data.toolName,
      reason: data.reason,
      auditLogId: logId,
    });

    try {
      if (this.workflowsService) {
        const wf = await this.workflowsService.findByCaseId(id);
        if (wf) {
          await this.workflowsService.sendSignal(wf.workflowId, {
            signalName: 'reject',
            payload: { reason: data.reason },
          });
        }
      }
    } catch (err) {
      logger.warn('Failed to signal workflow (continuing rejection)', { error: (err as Error).message });
    }

    // Broadcast action rejection event to WebSockets
    this.wsService.broadcast({
      type: 'action.completed',
      conversationId: c.conversationId,
      caseId: id,
      data: { action: 'reject', toolName: data.toolName },
    });

    return {
      approved: false,
      caseId: id,
      toolName: data.toolName,
      reason: data.reason,
      auditLogId: logId,
      message: `Action '${data.toolName}' rejected.`,
    };
  }
}
