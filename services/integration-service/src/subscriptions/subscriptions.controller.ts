import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('subscriptions')
@Controller('internal/v1/subscriptions')
export class SubscriptionsController {
  constructor(@Inject(SubscriptionsService) private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get canonical customer subscription details' })
  @ApiQuery({ name: 'customerId', description: 'Customer identifier (e.g. CUST-1001)', example: 'CUST-1001' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  async getSubscription(@Query('customerId') customerId: string) {
    return this.subscriptionsService.getSubscriptionByCustomer(customerId || 'CUST-1001');
  }
}
