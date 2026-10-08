import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller.js';
import { WorkflowsService } from './workflows.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
