import { describe, it, expect, vi } from 'vitest';
import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  it('generates a correlation ID when not present', () => {
    const req = { headers: {} } as unknown as FastifyRequest['raw'] & { correlationId?: string };
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as FastifyReply['raw'];
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(req.correlationId).toMatch(/^cor_/);
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
    expect(next).toHaveBeenCalledOnce();
  });

  it('preserves existing correlation ID', () => {
    const req = {
      headers: { [CORRELATION_ID_HEADER]: 'COR-EXISTING-123' },
    } as unknown as FastifyRequest['raw'] & { correlationId?: string };
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as FastifyReply['raw'];
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBe('COR-EXISTING-123');
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'COR-EXISTING-123');
    expect(next).toHaveBeenCalledOnce();
  });
});
