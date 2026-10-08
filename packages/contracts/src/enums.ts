/**
 * @csp/contracts — Shared enums used across all services
 * @see docs/06-core-api.md, docs/07-ai-orchestrator.md, docs/17-security.md
 */
import { z } from 'zod';

/** Communication channel */
export const ChannelSchema = z.enum(['web_chat', 'voice', 'email', 'sms', 'api']);
export type Channel = z.infer<typeof ChannelSchema>;

/** Conversation status */
export const ConversationStatusSchema = z.enum([
  'active',
  'waiting_for_customer',
  'waiting_for_agent',
  'escalated',
  'resolved',
  'closed',
]);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

/** Message role */
export const MessageRoleSchema = z.enum(['customer', 'assistant', 'agent', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

/** Case priority */
export const CasePrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export type CasePriority = z.infer<typeof CasePrioritySchema>;

/** Case status */
export const CaseStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'waiting_for_customer',
  'waiting_for_approval',
  'resolved',
  'closed',
]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

/** Escalation reason */
export const EscalationReasonSchema = z.enum([
  'low_confidence',
  'policy_violation',
  'customer_request',
  'high_risk_action',
  'conflicting_information',
  'sensitive_topic',
  'repeated_failure',
  'approval_required',
]);
export type EscalationReason = z.infer<typeof EscalationReasonSchema>;

/** Authentication level per docs/17-security.md */
export const AuthenticationLevelSchema = z.union([
  z.literal(0), // anonymous
  z.literal(1), // recognized session
  z.literal(2), // OTP or equivalent
  z.literal(3), // strong authentication
]);
export type AuthenticationLevel = z.infer<typeof AuthenticationLevelSchema>;

/** Sentiment */
export const SentimentSchema = z.enum(['positive', 'neutral', 'negative', 'frustrated']);
export type Sentiment = z.infer<typeof SentimentSchema>;

/** Risk level */
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/** Voice session state per docs/09-voice-service.md */
export const VoiceSessionStateSchema = z.enum([
  'connecting',
  'calibrating',
  'listening',
  'speech_detected',
  'transcribing',
  'thinking',
  'speaking',
  'interrupting',
  'closed',
]);
export type VoiceSessionState = z.infer<typeof VoiceSessionStateSchema>;

/** Order status */
export const OrderStatusValueSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]);
export type OrderStatusValue = z.infer<typeof OrderStatusValueSchema>;
