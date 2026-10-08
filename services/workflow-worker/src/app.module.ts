import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { RunnerModule } from './runner/runner.module.js';

@Module({
  imports: [HealthModule, RunnerModule],
})
export class AppModule {}
