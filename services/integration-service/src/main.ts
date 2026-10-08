/**
 * @csp/integration-service entry point
 * Fastify + NestJS bootstrap with OpenAPI documentation and Canonical Exception Filter.
 * @see docs/11-integration-service.md
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { CanonicalExceptionFilter } from './filters/canonical-exception.filter.js';
import { createLogger } from '@csp/logger';

const logger = createLogger('integration-service');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Global filters
  app.useGlobalFilters(new CanonicalExceptionFilter());

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Integration Service API')
    .setDescription('Canonical Integration APIs for CRM, orders, billing, and external systems')
    .setVersion('0.1.0')
    .addTag('orders', 'Canonical order queries and operations')
    .addTag('health', 'Liveness and readiness checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = parseInt(process.env.PORT ?? '8003', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
  logger.info('Integration Service started', {
    port,
    docs: `http://localhost:${port}/api-docs`,
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start Integration Service', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
