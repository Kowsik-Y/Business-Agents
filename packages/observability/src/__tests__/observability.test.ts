/**
 * Unit tests for @csp/observability — Correlation ID and trace context utilities
 */
import { describe, expect, it } from 'vitest';
import {
  generateCorrelationId,
  generateId,
  extractTraceContext,
  injectTraceHeaders,
  CORRELATION_ID_HEADER,
  TRACE_ID_HEADER,
  CONVERSATION_ID_HEADER,
} from '../index.js';

describe('generateCorrelationId', () => {
  it('generates unique IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('COR-')).toBe(true);
  });
});

describe('generateId', () => {
  it('generates IDs with the given prefix', () => {
    const id = generateId('TURN');
    expect(id.startsWith('TURN-')).toBe(true);
  });
});

describe('extractTraceContext', () => {
  it('extracts headers', () => {
    const ctx = extractTraceContext({
      [CORRELATION_ID_HEADER]: 'COR-123',
      [TRACE_ID_HEADER]: 'TRACE-456',
      [CONVERSATION_ID_HEADER]: 'CONV-789',
    });
    expect(ctx.correlationId).toBe('COR-123');
    expect(ctx.traceId).toBe('TRACE-456');
    expect(ctx.conversationId).toBe('CONV-789');
  });

  it('generates correlation ID when missing', () => {
    const ctx = extractTraceContext({});
    expect(ctx.correlationId).toBeDefined();
    expect(ctx.correlationId!.startsWith('COR-')).toBe(true);
  });

  it('handles array header values', () => {
    const ctx = extractTraceContext({
      [CORRELATION_ID_HEADER]: ['COR-FIRST', 'COR-SECOND'],
    });
    expect(ctx.correlationId).toBe('COR-FIRST');
  });
});

describe('injectTraceHeaders', () => {
  it('injects non-undefined context fields', () => {
    const headers = injectTraceHeaders({
      correlationId: 'COR-1',
      traceId: 'TRACE-1',
      conversationId: 'CONV-1',
    });
    expect(headers[CORRELATION_ID_HEADER]).toBe('COR-1');
    expect(headers[TRACE_ID_HEADER]).toBe('TRACE-1');
    expect(headers[CONVERSATION_ID_HEADER]).toBe('CONV-1');
  });

  it('omits undefined fields', () => {
    const headers = injectTraceHeaders({ correlationId: 'COR-1' });
    expect(headers[CORRELATION_ID_HEADER]).toBe('COR-1');
    expect(headers[TRACE_ID_HEADER]).toBeUndefined();
  });
});
