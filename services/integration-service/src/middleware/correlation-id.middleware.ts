/**
 * Correlation ID Middleware
 * Extracts or generates X-Correlation-ID for request tracing.
 * @see docs/14-api-contracts.md, docs/18-observability.md
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'] & { correlationId?: string }, res: FastifyReply['raw'], next: () => void) {
    const rawHeader = req.headers[CORRELATION_ID_HEADER];
    const correlationId = typeof rawHeader === 'string' && rawHeader.trim() !== ''
      ? rawHeader
      : `cor_${randomUUID()}`;

    req.correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
