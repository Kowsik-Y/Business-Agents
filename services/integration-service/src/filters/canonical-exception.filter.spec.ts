import { describe, it, expect, vi } from 'vitest';
import { CanonicalExceptionFilter } from './canonical-exception.filter.js';
import { NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ErrorCode } from '@csp/contracts';

describe('CanonicalExceptionFilter', () => {
  const filter = new CanonicalExceptionFilter();

  it('maps NotFoundException to NOT_FOUND with status 404', () => {
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ headers: { 'x-correlation-id': 'cor-test-123' } }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new NotFoundException('Order not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Order not found',
        correlationId: 'cor-test-123',
        details: undefined,
      },
    });
  });

  it('maps BadRequestException to VALIDATION_FAILED with status 400', () => {
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new BadRequestException('Invalid format'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Invalid format',
        correlationId: undefined,
        details: undefined,
      },
    });
  });
});
