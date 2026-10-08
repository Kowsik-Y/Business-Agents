/**
 * Correlation ID Middleware / Interceptor
 * Extracts or generates X-Correlation-ID for request tracking.
 * @see docs/14-api-contracts.md, docs/18-observability.md
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { defaultRateLimiter } from '@csp/auth';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const RATE_LIMIT_KEY = 'rate_limit_default_window';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'] & { correlationId?: string; ip?: string }, res: FastifyReply['raw'], next: () => void) {
    const rawHeader = req.headers[CORRELATION_ID_HEADER];
    const correlationId = typeof rawHeader === 'string' && rawHeader.trim() !== ''
      ? rawHeader
      : `cor_${randomUUID()}`;

    req.correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    // Rate limiting check against excessive request flooding
    const clientKey = req.ip || req.headers['x-forwarded-for'] || RATE_LIMIT_KEY;
    const rateLimit = defaultRateLimiter.checkLimit(String(clientKey), 2000, 60_000);
    if (!rateLimit.allowed) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }));
      return;
    }

    next();
  }
}
