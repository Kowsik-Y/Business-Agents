/**
 * Canonical Exception Filter
 * Maps HTTP and domain exceptions to standardized ApiError responses.
 * @see docs/11-integration-service.md, docs/14-api-contracts.md
 */
import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, type ApiError } from '@csp/contracts';
import { createLogger } from '@csp/logger';

const logger = createLogger('integration-service').child({ module: 'exception-filter' });

@Catch()
export class CanonicalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest['raw'] & { correlationId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || exception.message;
        if (obj.details) {
          details = obj.details as Record<string, unknown>;
        }
      }

      switch (status) {
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.BAD_REQUEST:
          code = ErrorCode.VALIDATION_FAILED;
          break;
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.NOT_AUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.CONFLICT:
          code = ErrorCode.CONFLICT;
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = ErrorCode.RATE_LIMITED;
          break;
        case HttpStatus.SERVICE_UNAVAILABLE:
          code = ErrorCode.SERVICE_UNAVAILABLE;
          break;
        case HttpStatus.GATEWAY_TIMEOUT:
          code = ErrorCode.PROVIDER_TIMEOUT;
          break;
        default:
          code = ErrorCode.INTERNAL_ERROR;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const correlationId = request.correlationId || (request.headers?.['x-correlation-id'] as string);

    const errorPayload: ApiError = {
      error: {
        code,
        message,
        correlationId,
        details,
      },
    };

    logger.warn('Handled canonical exception', {
      statusCode: status,
      code,
      message,
      correlationId,
    });

    response.status(status).send(errorPayload);
  }
}
