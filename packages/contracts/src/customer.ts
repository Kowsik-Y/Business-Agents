/**
 * @csp/contracts — Customer schemas
 * @see docs/06-core-api.md, docs/16-data-architecture.md
 */
import { z } from 'zod';
import { AuthenticationLevelSchema } from './enums.js';

export const CustomerSchema = z.object({
  id: z.string(),
  externalId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  authenticationLevel: AuthenticationLevelSchema,
  locale: z.string().default('en'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  externalId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  locale: z.string().default('en'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
