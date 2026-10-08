/**
 * Orders Controller
 * Canonical internal endpoints for order data retrieval.
 * @see docs/11-integration-service.md, docs/14-api-contracts.md
 */
import { Controller, Get, Post, Param, Query, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@Controller('internal/v1/orders')
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders for a customer' })
  @ApiQuery({ name: 'customerId', description: 'Customer identifier (e.g. CUST-1001)', example: 'CUST-1001' })
  @ApiResponse({ status: 200, description: 'Orders list retrieved' })
  async listOrders(@Query('customerId') customerId: string) {
    return this.ordersService.getOrdersByCustomer(customerId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get canonical order status by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order identifier (e.g. ORD-1001)', example: 'ORD-1001' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrder(orderId);
  }

  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel an order by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order identifier (e.g. ORD-1001)', example: 'ORD-1001' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string }
  ) {
    return this.ordersService.cancelOrder(orderId, body?.reason);
  }
}
