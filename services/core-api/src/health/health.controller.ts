import { Controller, Get, Header, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { defaultRegistry, initTelemetry } from '@csp/observability';
import { DATABASE_TOKEN } from '../database/database.module.js';
import type { Database } from '../db/index.js';
import { sql as rawSql } from 'drizzle-orm';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {
    initTelemetry({ serviceName: 'core-api', serviceVersion: '0.1.0', environment: process.env.NODE_ENV || 'development' });
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe' })
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe — checks database connectivity' })
  async ready(): Promise<{ status: string; database: string }> {
    try {
      await this.db.execute(rawSql`SELECT 1`);
      return { status: 'ok', database: 'connected' };
    } catch {
      return { status: 'degraded', database: 'unreachable' };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus telemetry and metrics exporter' })
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    return defaultRegistry.exportPrometheusMetrics();
  }
}
