import { z } from 'zod';

export const NotificationRequestSchema = z.object({
  channel: z.enum(['email', 'sms', 'push', 'web_message']).default('email'),
  template: z.string(),
  locale: z.string().default('en'),
  recipient: z.object({
    customerId: z.string(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
  }),
  variables: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().optional(),
});

export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;

export interface NotificationRecord {
  id: string;
  channel: string;
  template: string;
  locale: string;
  recipient: {
    customerId: string;
    email?: string;
    phoneNumber?: string;
  };
  renderedSubject: string;
  renderedBody: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'suppressed';
  errorReason?: string;
  idempotencyKey?: string;
  createdAt: string;
}
