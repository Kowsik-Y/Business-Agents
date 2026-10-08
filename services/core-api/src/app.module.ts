import { Module, type NestModule, type MiddlewareConsumer } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { ConversationModule } from './conversation/conversation.module.js';
import { CasesModule } from './cases/cases.module.js';
import { WorkflowsModule } from './workflows/workflows.module.js';
import { DatabaseModule } from './database/database.module.js';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';

import { WebSocketModule } from './websocket/websocket.module.js';

@Module({
  imports: [DatabaseModule, HealthModule, ConversationModule, CasesModule, WorkflowsModule, WebSocketModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
