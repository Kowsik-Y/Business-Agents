import { Module, type NestModule, type MiddlewareConsumer } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { WarrantiesModule } from './warranties/warranties.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';

@Module({
  imports: [HealthModule, OrdersModule, SubscriptionsModule, WarrantiesModule, DevicesModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
