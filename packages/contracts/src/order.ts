/**
 * @csp/contracts — Order status schemas
 * @see docs/11-integration-service.md
 */
import { z } from 'zod';
import { OrderStatusValueSchema } from './enums.js';

export const OrderStatusSchema = z.object({
  orderId: z.string(),
  status: OrderStatusValueSchema,
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderStatusRequestSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().optional(),
});

export type OrderStatusRequest = z.infer<typeof OrderStatusRequestSchema>;
