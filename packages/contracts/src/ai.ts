/**
 * @csp/contracts — AI request and streaming event schemas
 * @see docs/07-ai-orchestrator.md, docs/14-api-contracts.md
 */
import { z } from 'zod';
import { AuthenticationLevelSchema, ChannelSchema } from './enums.js';

// ---------- Assistant Turn Request ----------

export const AssistantTurnRequestSchema = z.object({
  turnId: z.string(),
  conversationId: z.string(),
  customerId: z.string(),
  channel: ChannelSchema,
  messageId: z.string(),
  message: z.string(),
  language: z.string().default('en'),
  authenticationLevel: AuthenticationLevelSchema,
  context: z
    .object({
      recentOrderIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AssistantTurnRequest = z.infer<typeof AssistantTurnRequestSchema>;

// ---------- Streaming Events ----------

export const StreamEventTypeSchema = z.enum([
  'turn.started',
  'intent.detected',
  'retrieval.started',
  'retrieval.completed',
  'tool.proposed',
  'tool.started',
  'tool.completed',
  'text.delta',
  'handoff.required',
  'turn.completed',
  'turn.failed',
]);

export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;

export const BaseStreamEventSchema = z.object({
  type: StreamEventTypeSchema,
  turnId: z.string(),
  sequence: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export const TextDeltaEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('text.delta'),
  content: z.string(),
});

export const IntentDetectedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('intent.detected'),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
});

export const ToolProposedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('tool.proposed'),
  tool: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  requiresConfirmation: z.boolean(),
  requiresHumanApproval: z.boolean(),
});

export const ToolCompletedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('tool.completed'),
  tool: z.string(),
  success: z.boolean(),
});

export const TurnCompletedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('turn.completed'),
  responseId: z.string(),
});

export const TurnFailedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('turn.failed'),
  errorCode: z.string(),
  errorMessage: z.string(),
});

export const HandoffRequiredEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('handoff.required'),
  reason: z.string(),
});

/** Union of all typed stream events */
export const StreamEventSchema = z.discriminatedUnion('type', [
  TextDeltaEventSchema,
  IntentDetectedEventSchema,
  ToolProposedEventSchema,
  ToolCompletedEventSchema,
  TurnCompletedEventSchema,
  TurnFailedEventSchema,
  HandoffRequiredEventSchema,
  BaseStreamEventSchema.extend({ type: z.literal('turn.started') }),
  BaseStreamEventSchema.extend({ type: z.literal('retrieval.started') }),
  BaseStreamEventSchema.extend({ type: z.literal('retrieval.completed') }),
  BaseStreamEventSchema.extend({ type: z.literal('tool.started') }),
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;
