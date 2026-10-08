/**
 * Cases module — NestJS module for case management and escalation handoffs.
 * @see docs/04-agent-console.md, docs/06-core-api.md
 */
import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller.js';
import { CasesService } from './cases.service.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';

@Module({
  imports: [WorkflowsModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
