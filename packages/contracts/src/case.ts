/**
 * @csp/contracts — Case, Escalation, and HandoffPackage schemas
 * @see docs/06-core-api.md, docs/04-agent-console.md
 */
import { z } from 'zod';
import {
  CasePrioritySchema,
  CaseStatusSchema,
  EscalationReasonSchema,
  SentimentSchema,
  RiskLevelSchema,
  AuthenticationLevelSchema,
} from './enums.js';

// ---------- Escalation ----------

export const EscalationSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  caseId: z.string().optional(),
  reason: EscalationReasonSchema,
  summary: z.string(),
  activeIntent: z.string().optional(),
  secondaryIntents: z.array(z.string()).optional(),
  sentiment: SentimentSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
  informationCollected: z.record(z.string(), z.unknown()).optional(),
  missingInformation: z.array(z.string()).optional(),
  actionsAttempted: z.array(z.string()).optional(),
  recommendedNextAction: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type Escalation = z.infer<typeof EscalationSchema>;

// ---------- Handoff Package (docs/04-agent-console.md) ----------

export const HandoffPackageSchema = z.object({
  conversationId: z.string(),
  caseId: z.string().optional(),
  customerId: z.string(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  channel: z.string().default('web_chat'),
  authenticationLevel: AuthenticationLevelSchema.default(0),
  activeIntent: z.string().optional(),
  secondaryIntents: z.array(z.string()).default([]),
  sentiment: SentimentSchema.default('neutral'),
  riskLevel: RiskLevelSchema.default('low'),
  summary: z.string(),
  informationCollected: z.record(z.string(), z.unknown()).default({}),
  missingInformation: z.array(z.string()).default([]),
  actionsAttempted: z.array(z.string()).default([]),
  relevantBusinessObjects: z.record(z.string(), z.unknown()).optional(),
  retrievedSources: z.array(z.string()).default([]),
  escalationReason: EscalationReasonSchema.default('customer_request'),
  recommendedNextAction: z.string().optional(),
  pendingProposedTool: z
    .object({
      toolName: z.string(),
      arguments: z.record(z.string(), z.unknown()),
      policyReason: z.string().optional(),
      requiresHumanApproval: z.boolean().default(true),
    })
    .optional(),
  createdAt: z.string().datetime().optional(),
});

export type HandoffPackage = z.infer<typeof HandoffPackageSchema>;

// ---------- Case ----------

export const CaseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  customerId: z.string(),
  customerName: z.string().optional(),
  assignedAgentId: z.string().optional(),
  status: CaseStatusSchema,
  priority: CasePrioritySchema,
  subject: z.string(),
  summary: z.string().optional(),
  escalation: EscalationSchema.optional(),
  handoffPackage: HandoffPackageSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
});

export type Case = z.infer<typeof CaseSchema>;

export const CreateCaseSchema = z.object({
  conversationId: z.string(),
  customerId: z.string(),
  priority: CasePrioritySchema.default('medium'),
  subject: z.string(),
  summary: z.string().optional(),
  handoffPackage: HandoffPackageSchema.optional(),
});

export type CreateCase = z.infer<typeof CreateCaseSchema>;

export const UpdateCaseSchema = z.object({
  assignedAgentId: z.string().nullable().optional(),
  status: CaseStatusSchema.optional(),
  priority: CasePrioritySchema.optional(),
  subject: z.string().optional(),
  summary: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
});

export type UpdateCase = z.infer<typeof UpdateCaseSchema>;

export const ApproveActionSchema = z.object({
  toolName: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  agentNotes: z.string().optional(),
});

export type ApproveAction = z.infer<typeof ApproveActionSchema>;

export const RejectActionSchema = z.object({
  toolName: z.string(),
  reason: z.string(),
  agentNotes: z.string().optional(),
});

export type RejectAction = z.infer<typeof RejectActionSchema>;

export const CaseFilterSchema = z.object({
  status: CaseStatusSchema.optional(),
  priority: CasePrioritySchema.optional(),
  assignedAgentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CaseFilter = z.infer<typeof CaseFilterSchema>;
