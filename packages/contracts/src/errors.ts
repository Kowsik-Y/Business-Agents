/**
 * @csp/contracts — Standard API error shape
 * @see docs/14-api-contracts.md
 */
import { z } from 'zod';

export const ApiErrorDetailSchema = z.record(z.string(), z.unknown()).optional();

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    correlationId: z.string().optional(),
    details: ApiErrorDetailSchema,
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Well-known error codes used across services */
export const ErrorCode = {
  // General
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Domain-specific
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  CASE_NOT_FOUND: 'CASE_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  TOOL_NOT_REGISTERED: 'TOOL_NOT_REGISTERED',
  TOOL_NOT_AUTHORIZED: 'TOOL_NOT_AUTHORIZED',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  ESCALATION_REQUIRED: 'ESCALATION_REQUIRED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',

  // Voice
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
