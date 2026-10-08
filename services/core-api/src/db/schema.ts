/**
 * Database schema definitions using Drizzle ORM.
 * Covers customer, conversation, case_management, policy, and audit schemas.
 * @see docs/16-data-architecture.md
 */
import { pgSchema, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

// ---------- Schema namespaces ----------

export const customerSchema = pgSchema('customer');
export const conversationSchema = pgSchema('conversation');
export const caseManagementSchema = pgSchema('case_management');
export const policySchema = pgSchema('policy');
export const auditSchema = pgSchema('audit');
export const workflowReferenceSchema = pgSchema('workflow_reference');
export const notificationSchema = pgSchema('notification');

// ---------- customer.customers ----------

export const customers = customerSchema.table('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  externalId: text('external_id'),
  email: text('email'),
  name: text('name'),
  authenticationLevel: integer('authentication_level').notNull().default(0),
  locale: text('locale').notNull().default('en'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- conversation.conversations ----------

export const conversations = conversationSchema.table('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull(),
  status: text('status').notNull().default('active'),
  channel: text('channel').notNull().default('web_chat'),
  subject: text('subject'),
  activeIntent: text('active_intent'),
  sentiment: text('sentiment'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- conversation.messages ----------

export const messages = conversationSchema.table('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  channel: text('channel').notNull().default('web_chat'),
  language: text('language'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- conversation.turns ----------

export const turns = conversationSchema.table('turns', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull(),
  messageId: text('message_id').notNull(),
  status: text('status').notNull().default('started'),
  intent: text('intent'),
  responseId: text('response_id'),
  errorCode: text('error_code'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ---------- case_management.cases ----------

export const cases = caseManagementSchema.table('cases', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull(),
  customerId: text('customer_id').notNull(),
  assignedAgentId: text('assigned_agent_id'),
  status: text('status').notNull().default('open'),
  priority: text('priority').notNull().default('medium'),
  subject: text('subject').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// ---------- case_management.escalations ----------

export const escalations = caseManagementSchema.table('escalations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull(),
  caseId: text('case_id'),
  reason: text('reason').notNull(),
  summary: text('summary').notNull(),
  activeIntent: text('active_intent'),
  sentiment: text('sentiment'),
  riskLevel: text('risk_level'),
  informationCollected: jsonb('information_collected'),
  missingInformation: jsonb('missing_information'),
  actionsAttempted: jsonb('actions_attempted'),
  recommendedNextAction: text('recommended_next_action'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- policy.tool_policies ----------

export const toolPolicies = policySchema.table('tool_policies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  toolName: text('tool_name').notNull(),
  requiredAuthLevel: integer('required_auth_level').notNull().default(0),
  requiresConfirmation: boolean('requires_confirmation').notNull().default(false),
  requiresHumanApproval: boolean('requires_human_approval').notNull().default(false),
  isEnabled: boolean('is_enabled').notNull().default(true),
  config: jsonb('config'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- audit.action_logs ----------

export const actionLogs = auditSchema.table('action_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text('actor_id').notNull(),
  actorType: text('actor_type').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  correlationId: text('correlation_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- audit.tool_executions ----------

export const toolExecutions = auditSchema.table('tool_executions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  turnId: text('turn_id').notNull(),
  conversationId: text('conversation_id').notNull(),
  customerId: text('customer_id').notNull(),
  toolName: text('tool_name').notNull(),
  arguments: jsonb('arguments').notNull(),
  success: boolean('success').notNull(),
  result: jsonb('result'),
  errorCode: text('error_code'),
  policyDecisionId: text('policy_decision_id'),
  durationMs: integer('duration_ms').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- workflow_reference.instances ----------

export const workflowInstances = workflowReferenceSchema.table('instances', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workflowId: text('workflow_id').notNull().unique(),
  workflowType: text('workflow_type').notNull(),
  status: text('status').notNull().default('running'), // running, waiting_for_approval, completed, failed, cancelled
  caseId: text('case_id'),
  orderId: text('order_id'),
  input: jsonb('input'),
  output: jsonb('output'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ---------- notification.notifications ----------

export const notificationsTable = notificationSchema.table('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipientCustomerId: text('recipient_customer_id').notNull(),
  channel: text('channel').notNull().default('email'),
  template: text('template').notNull(),
  status: text('status').notNull().default('delivered'),
  renderedSubject: text('rendered_subject'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
