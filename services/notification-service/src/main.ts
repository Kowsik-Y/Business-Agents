/**
 * @csp/notification-service entry point
 * Fastify + NestJS bootstrap with OpenAPI documentation.
 * @see docs/12-notification-service.md
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { createLogger } from '@csp/logger';

const logger = createLogger('notification-service');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Transactional messaging and localized template rendering engine')
    .setVersion('0.1.0')
    .addTag('notifications', 'Transactional notification dispatch and tracking')
    .addTag('health', 'Liveness and readiness checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = parseInt(process.env.PORT ?? '8005', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
  logger.info('Notification Service started', {
    port,
    docs: `http://localhost:${port}/api-docs`,
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start Notification Service', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
