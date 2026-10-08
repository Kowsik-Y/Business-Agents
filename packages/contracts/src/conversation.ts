/**
 * @csp/contracts — Conversation and Message schemas
 * @see docs/06-core-api.md, docs/14-api-contracts.md, docs/16-data-architecture.md
 */
import { z } from 'zod';
import {
  ChannelSchema,
  ConversationStatusSchema,
  MessageRoleSchema,
  SentimentSchema,
} from './enums.js';

// ---------- Message ----------

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  channel: ChannelSchema,
  language: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  role: MessageRoleSchema.default('customer'),
  channel: ChannelSchema.default('web_chat'),
  language: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

// ---------- Conversation ----------

export const ConversationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: ConversationStatusSchema,
  channel: ChannelSchema,
  subject: z.string().optional(),
  activeIntent: z.string().optional(),
  sentiment: SentimentSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const CreateConversationSchema = z.object({
  customerId: z.string(),
  channel: ChannelSchema.default('web_chat'),
  subject: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateConversation = z.infer<typeof CreateConversationSchema>;

export const ConversationWithMessagesSchema = ConversationSchema.extend({
  messages: z.array(MessageSchema),
});

export type ConversationWithMessages = z.infer<typeof ConversationWithMessagesSchema>;
