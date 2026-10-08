import { Controller, Post, Get, Body, Param, Inject, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkflowRunnerService, type WorkflowSignalRequest } from './workflow-runner.service.js';
import { z } from 'zod';

const ExecuteRequestSchema = z.object({
  workflowId: z.string(),
  workflowType: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
});

const SignalRequestSchema = z.object({
  signalName: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

@ApiTags('workflows')
@Controller('internal/v1/workflows')
export class WorkflowRunnerController {
  constructor(@Inject(WorkflowRunnerService) private readonly runner: WorkflowRunnerService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Trigger or register durable workflow execution in worker' })
  @ApiResponse({ status: 201, description: 'Execution started or existing returned' })
  async execute(@Body() body: unknown) {
    const parsed = ExecuteRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid execution payload', issues: parsed.error.issues });
    }
    return this.runner.executeWorkflow(parsed.data);
  }

  @Post(':id/signal')
  @ApiOperation({ summary: 'Send an asynchronous operational signal (approve, reject) to active execution' })
  @ApiParam({ name: 'id', description: 'Unique workflowId' })
  @ApiResponse({ status: 200, description: 'Signal delivered and state transitioned' })
  async signal(@Param('id') id: string, @Body() body: unknown) {
    const parsed = SignalRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid signal payload', issues: parsed.error.issues });
    }
    return this.runner.sendSignal(id, parsed.data as WorkflowSignalRequest);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve worker execution state and outputs' })
  @ApiParam({ name: 'id', description: 'Unique workflowId' })
  @ApiResponse({ status: 200, description: 'State found' })
  async getStatus(@Param('id') id: string) {
    return this.runner.getStatus(id);
  }
}
