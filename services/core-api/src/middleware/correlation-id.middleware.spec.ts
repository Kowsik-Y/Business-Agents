import { describe, it, expect, vi } from 'vitest';
import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware.js';
import { defaultRateLimiter } from '@csp/auth';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  it('generates a new correlation ID when not provided in request', () => {
    const req = { headers: {} } as FastifyRequest['raw'] & { correlationId?: string };
    const setHeaderMock = vi.fn();
    const res = { setHeader: setHeaderMock } as unknown as FastifyReply['raw'];
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(req.correlationId).toMatch(/^cor_[0-9a-f-]+$/);
    expect(setHeaderMock).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
    expect(next).toHaveBeenCalledOnce();
  });

  it('reuses existing correlation ID when provided in request headers', () => {
    const existingId = 'COR-999-ABC';
    const req = {
      headers: { [CORRELATION_ID_HEADER]: existingId },
    } as unknown as FastifyRequest['raw'] & { correlationId?: string };
    const setHeaderMock = vi.fn();
    const res = { setHeader: setHeaderMock } as unknown as FastifyReply['raw'];
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBe(existingId);
    expect(setHeaderMock).toHaveBeenCalledWith(CORRELATION_ID_HEADER, existingId);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 429 when rate limit is exceeded for client IP', () => {
    const floodIp = '99.99.99.99';
    // Exhaust rate limit for this IP
    for (let i = 0; i < 2000; i++) {
      defaultRateLimiter.checkLimit(floodIp, 2000, 60_000);
    }

    const req = { headers: {}, ip: floodIp } as unknown as FastifyRequest['raw'] & { correlationId?: string; ip?: string };
    const setHeaderMock = vi.fn();
    const endMock = vi.fn();
    const res = { setHeader: setHeaderMock, end: endMock, statusCode: 200 } as unknown as FastifyReply['raw'] & { statusCode: number };
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(res.statusCode).toBe(429);
    expect(endMock).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});
