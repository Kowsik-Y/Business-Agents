/**
 * Health check endpoints for Workflow Worker.
 * @see docs/10-workflow-worker.md
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Worker service is alive' })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Worker is ready to execute workflows and receive signals' })
  ready() {
    return { status: 'ok', service: 'workflow-worker' };
  }
}
