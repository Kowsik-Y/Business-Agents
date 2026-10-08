import { Module } from '@nestjs/common';
import { WorkflowRunnerController } from './workflow-runner.controller.js';
import { WorkflowRunnerService } from './workflow-runner.service.js';

@Module({
  controllers: [WorkflowRunnerController],
  providers: [WorkflowRunnerService],
  exports: [WorkflowRunnerService],
})
export class RunnerModule {}
