/**
 * @csp/contracts — Voice session and event schemas
 * @see docs/09-voice-service.md
 */
import { z } from 'zod';
import { VoiceSessionStateSchema } from './enums.js';

// ---------- Voice Session ----------

export const VoiceSessionSchema = z.object({
  sessionId: z.string(),
  conversationId: z.string(),
  customerId: z.string(),
  token: z.string(),
  websocketUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  supportedCodecs: z.array(z.string()).default(['pcm_s16le']),
});

export type VoiceSession = z.infer<typeof VoiceSessionSchema>;

export const CreateVoiceSessionSchema = z.object({
  conversationId: z.string(),
  customerId: z.string(),
});

export type CreateVoiceSession = z.infer<typeof CreateVoiceSessionSchema>;

// ---------- Voice Client Events (browser → server) ----------

export const VoiceClientEventTypeSchema = z.enum([
  'session.start',
  'response.cancel',
  'session.stop',
]);

export type VoiceClientEventType = z.infer<typeof VoiceClientEventTypeSchema>;

export const VoiceClientEventSchema = z.object({
  type: VoiceClientEventTypeSchema,
  sessionId: z.string(),
  timestamp: z.string().datetime(),
  responseId: z.string().optional(),
});

export type VoiceClientEvent = z.infer<typeof VoiceClientEventSchema>;

// ---------- Voice Server Events (server → browser) ----------

export const VoiceServerEventTypeSchema = z.enum([
  'session.ready',
  'input_audio.speech_started',
  'input_audio.speech_stopped',
  'transcript.final',
  'response.text.delta',
  'response.audio.started',
  'response.completed',
  'error',
]);

export type VoiceServerEventType = z.infer<typeof VoiceServerEventTypeSchema>;

export const VoiceServerEventSchema = z.object({
  type: VoiceServerEventTypeSchema,
  sessionId: z.string(),
  timestamp: z.string().datetime(),
  responseId: z.string().optional(),
  content: z.string().optional(),
  state: VoiceSessionStateSchema.optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type VoiceServerEvent = z.infer<typeof VoiceServerEventSchema>;
