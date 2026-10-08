import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe.js';
import { CreateConversationSchema } from '@csp/contracts';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(CreateConversationSchema);

  it('passes valid input through untouched or coerced', () => {
    const valid = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      channel: 'web_chat' as const,
      subject: 'Order inquiry',
    };
    const result = pipe.transform(valid);
    expect(result).toMatchObject(valid);
  });

  it('throws BadRequestException with standardized error format for invalid input', () => {
    expect.assertions(3);
    try {
      pipe.transform({});
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = (err as BadRequestException).getResponse() as { error: { code: string; details: { errors: Array<{ path: string }> } } };
      expect(res.error.code).toBe('VALIDATION_FAILED');
      expect(res.error.details.errors.some((e) => e.path === 'customerId')).toBe(true);
    }
  });
});
