/**
 * @csp/contracts — Tool request, response, and policy schemas
 * @see docs/07-ai-orchestrator.md, docs/06-core-api.md
 */
import { z } from 'zod';
import { AuthenticationLevelSchema } from './enums.js';

// ---------- Tool Definition ----------

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  requiredAuthenticationLevel: AuthenticationLevelSchema,
  requiresConfirmation: z.boolean().default(false),
  requiresHumanApproval: z.boolean().default(false),
  timeout: z.number().int().positive().default(30000),
  idempotent: z.boolean().default(false),
  auditCategory: z.string(),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// ---------- Tool Request / Response ----------

export const ToolRequestSchema = z.object({
  toolName: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  turnId: z.string(),
  conversationId: z.string(),
  customerId: z.string(),
  idempotencyKey: z.string().optional(),
});

export type ToolRequest = z.infer<typeof ToolRequestSchema>;

export const ToolResponseSchema = z.object({
  toolName: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  executionId: z.string(),
  durationMs: z.number().int().nonnegative(),
});

export type ToolResponse = z.infer<typeof ToolResponseSchema>;

// ---------- Policy Decision ----------

export const PolicyDecisionSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  allowed: z.boolean(),
  reason: z.string(),
  authenticationLevel: AuthenticationLevelSchema,
  requiredLevel: AuthenticationLevelSchema,
  customerOwnershipVerified: z.boolean(),
  policyRuleId: z.string().optional(),
  requiresConfirmation: z.boolean(),
  requiresHumanApproval: z.boolean(),
  decidedAt: z.string().datetime(),
});

export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
