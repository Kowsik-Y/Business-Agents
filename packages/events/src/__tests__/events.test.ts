/**
 * Unit tests for @csp/events — Event envelope and catalog
 */
import { describe, expect, it } from 'vitest';
import {
  EventEnvelopeSchema,
  EventTypes,
  ConversationEventType,
  CaseEventType,
  WorkflowEventType,
  createEvent,
} from '../index.js';

describe('EventEnvelopeSchema', () => {
  it('validates a complete event envelope', () => {
    const result = EventEnvelopeSchema.safeParse({
      eventId: 'EVT-100',
      eventType: 'support.case.escalated',
      eventVersion: 1,
      occurredAt: '2026-08-05T07:00:00Z',
      producer: 'core-api',
      correlationId: 'COR-200',
      traceId: 'TRACE-300',
      subject: 'CASE-400',
      data: { reason: 'low_confidence' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing eventType', () => {
    const result = EventEnvelopeSchema.safeParse({
      eventId: 'EVT-1',
      eventVersion: 1,
      occurredAt: '2026-01-01T00:00:00Z',
      producer: 'core-api',
      correlationId: 'COR-1',
      subject: 'CASE-1',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects eventVersion of 0', () => {
    const result = EventEnvelopeSchema.safeParse({
      eventId: 'EVT-1',
      eventType: 'test',
      eventVersion: 0,
      occurredAt: '2026-01-01T00:00:00Z',
      producer: 'core-api',
      correlationId: 'COR-1',
      subject: 'SUB-1',
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('createEvent', () => {
  it('creates a valid event envelope', () => {
    const event = createEvent(
      ConversationEventType.CREATED,
      'core-api',
      'CONV-1',
      { customerId: 'CUST-1' },
      { correlationId: 'COR-TEST' },
    );

    expect(event.eventType).toBe('conversation.created');
    expect(event.producer).toBe('core-api');
    expect(event.subject).toBe('CONV-1');
    expect(event.correlationId).toBe('COR-TEST');
    expect(event.data).toEqual({ customerId: 'CUST-1' });

    // Should pass schema validation
    const result = EventEnvelopeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('generates unique event IDs', () => {
    const e1 = createEvent('test', 'svc', 'sub', {});
    const e2 = createEvent('test', 'svc', 'sub', {});
    expect(e1.eventId).not.toBe(e2.eventId);
  });
});

describe('Event type catalog', () => {
  it('has conversation events', () => {
    expect(ConversationEventType.CREATED).toBe('conversation.created');
    expect(ConversationEventType.MESSAGE_RECEIVED).toBe('conversation.message.received');
  });

  it('has case events', () => {
    expect(CaseEventType.ESCALATED).toBe('support.case.escalated');
  });

  it('has workflow events', () => {
    expect(WorkflowEventType.STARTED).toBe('workflow.started');
    expect(WorkflowEventType.COMPLETED).toBe('workflow.completed');
  });

  it('aggregates all events in EventTypes', () => {
    // Note: CREATED is overwritten by CaseEventType in spread order
    expect(EventTypes.ESCALATED).toBe('support.case.escalated');
    expect(EventTypes.COMPLETED).toBe('workflow.completed');
    expect(EventTypes.MESSAGE_RECEIVED).toBe('conversation.message.received');
    expect(EventTypes.ORDER_STATUS_CHANGED).toBe('order.status.changed');
    expect(EventTypes.QUEUED).toBe('notification.queued');
  });
});
