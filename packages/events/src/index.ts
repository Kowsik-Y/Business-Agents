/**
 * @csp/events — Domain event envelope and catalog
 * @see docs/15-event-contracts.md
 */
import { z } from 'zod';

// ---------- Event Envelope ----------

export const EventEnvelopeSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  eventVersion: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  producer: z.string(),
  correlationId: z.string(),
  traceId: z.string().optional(),
  subject: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// ---------- Event Type Catalog ----------

/** Conversation domain events */
export const ConversationEventType = {
  CREATED: 'conversation.created',
  MESSAGE_RECEIVED: 'conversation.message.received',
  INTENT_DETECTED: 'conversation.intent.detected',
  RESPONSE_COMPLETED: 'conversation.response.completed',
  CLOSED: 'conversation.closed',
} as const;

/** Case and handoff domain events */
export const CaseEventType = {
  CREATED: 'support.case.created',
  ASSIGNED: 'support.case.assigned',
  ESCALATED: 'support.case.escalated',
  RESOLVED: 'support.case.resolved',
  APPROVAL_REQUESTED: 'human.approval.requested',
  APPROVAL_COMPLETED: 'human.approval.completed',
} as const;

/** Knowledge domain events */
export const KnowledgeEventType = {
  DOCUMENT_UPLOADED: 'knowledge.document.uploaded',
  DOCUMENT_INDEXED: 'knowledge.document.indexed',
  DOCUMENT_ACTIVATED: 'knowledge.document.activated',
  DOCUMENT_RETIRED: 'knowledge.document.retired',
  CONFLICT_DETECTED: 'knowledge.conflict.detected',
} as const;

/** Workflow domain events */
export const WorkflowEventType = {
  STARTED: 'workflow.started',
  WAITING: 'workflow.waiting',
  COMPLETED: 'workflow.completed',
  FAILED: 'workflow.failed',
  CANCELLED: 'workflow.cancelled',
} as const;

/** Integration domain events */
export const IntegrationEventType = {
  ORDER_STATUS_CHANGED: 'order.status.changed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  BILLING_DISPUTE_CREATED: 'billing.dispute.created',
  WARRANTY_CLAIM_CREATED: 'warranty.claim.created',
  SERVICE_APPOINTMENT_BOOKED: 'service.appointment.booked',
} as const;

/** Notification domain events */
export const NotificationEventType = {
  QUEUED: 'notification.queued',
  DELIVERED: 'notification.delivered',
  FAILED: 'notification.failed',
} as const;

/** All event type constants for convenience */
export const EventTypes = {
  ...ConversationEventType,
  ...CaseEventType,
  ...KnowledgeEventType,
  ...WorkflowEventType,
  ...IntegrationEventType,
  ...NotificationEventType,
} as const;

// ---------- Helper: Create Event ----------

let _sequence = 0;

export function createEvent(
  type: string,
  producer: string,
  subject: string,
  data: Record<string, unknown>,
  options?: { correlationId?: string; traceId?: string; version?: number },
): EventEnvelope {
  _sequence += 1;
  return {
    eventId: `EVT-${Date.now()}-${_sequence}`,
    eventType: type,
    eventVersion: options?.version ?? 1,
    occurredAt: new Date().toISOString(),
    producer,
    correlationId: options?.correlationId ?? `COR-${Date.now()}`,
    traceId: options?.traceId,
    subject,
    data,
  };
}
