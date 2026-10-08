/**
 * Zod validation pipe for NestJS.
 * Validates request bodies using Zod schemas, per docs/06-core-api.md.
 */
import { type PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: { errors },
        },
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Array<{ path: string; message: string }> {
    return error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }
}
