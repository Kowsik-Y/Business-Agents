import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [HealthModule, NotificationsModule],
})
export class AppModule {}
