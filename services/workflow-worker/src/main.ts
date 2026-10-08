/**
 * @csp/workflow-worker entry point
 * Temporal Worker daemon & HTTP command bridge on port 8006.
 * @see docs/10-workflow-worker.md
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { createLogger } from '@csp/logger';

const logger = createLogger('workflow-worker');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const config = new DocumentBuilder()
    .setTitle('Workflow Worker & Engine API')
    .setDescription('Temporal workflow management, durable business process execution, and human signal routing')
    .setVersion('0.1.0')
    .addTag('workflows', 'Trigger execution and deliver asynchronous signals')
    .addTag('health', 'Liveness and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = parseInt(process.env.PORT ?? '8006', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
  logger.info('Workflow Worker service active', {
    port,
    docs: `http://localhost:${port}/api-docs`,
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error starting Workflow Worker', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
