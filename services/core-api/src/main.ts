/**
 * Core API — NestJS application entry point
 * @see docs/06-core-api.md
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { WebSocketService } from './websocket/websocket.service.js';
import { createLogger } from '@csp/logger';

const logger = createLogger('core-api');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Global prefix
  app.setGlobalPrefix('v1', { exclude: ['health/live', 'health/ready'] });

  // CORS
  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
  });

  // OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Core API')
    .setDescription('Customer Success Platform — Core Business API')
    .setVersion('0.1.0')
    .addTag('conversations')
    .addTag('messages')
    .addTag('cases')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = parseInt(process.env['PORT'] ?? '8000', 10);
  await app.listen(port, '0.0.0.0');

  // Initialize Real-time WebSocket Server on the HTTP instance
  const wsService = app.get(WebSocketService);
  const httpServer = app.getHttpServer();
  wsService.initialize(httpServer);

  logger.info('Core API started with WebSockets', {
    port,
    ws: `ws://localhost:${port}/ws`,
    docs: `http://localhost:${port}/api-docs`,
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start Core API', { error: String(err) });
  process.exit(1);
});
