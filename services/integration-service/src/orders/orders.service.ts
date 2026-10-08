/**
 * Orders Service
 * Handles order lookup and business logic with canonical logging.
 * @see docs/11-integration-service.md
 */
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { OrdersRepository } from './orders.repository.js';
import type { OrderStatus } from '@csp/contracts';
import { createLogger } from '@csp/logger';

const logger = createLogger('integration-service').child({ module: 'orders' });

@Injectable()
export class OrdersService {
  constructor(@Inject(OrdersRepository) private readonly ordersRepo: OrdersRepository) {}

  /** Find order by ID or throw NotFoundException */
  async getOrder(orderId: string): Promise<OrderStatus> {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      logger.warn('Order not found', { orderId });
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    logger.info('Order retrieved', {
      orderId: order.orderId,
      status: order.status,
      carrier: order.carrier,
    });

    return order;
  }

  /** Find all orders for a given customer */
  async getOrdersByCustomer(customerId: string): Promise<OrderStatus[]> {
    const orders = await this.ordersRepo.findByCustomerId(customerId);
    logger.info('Customer orders retrieved', { customerId, count: orders.length });
    return orders;
  }

  /** Cancel an order by order ID */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderStatus> {
    const order = await this.ordersRepo.cancelOrder(orderId, reason);
    logger.info('Order successfully cancelled in system', {
      orderId: order.orderId,
      status: order.status,
      reason,
    });
    return order;
  }
}
