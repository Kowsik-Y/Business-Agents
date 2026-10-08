import { Controller, Post, Get, Body, Param, Inject, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service.js';
import { z } from 'zod';

const StartWorkflowSchema = z.object({
  workflowId: z.string(),
  workflowType: z.string(),
  caseId: z.string().optional(),
  orderId: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

const SignalWorkflowSchema = z.object({
  signalName: z.enum(['approve', 'reject', 'request_more_information', 'cancel']),
  payload: z.record(z.string(), z.unknown()).optional(),
});

@ApiTags('workflows')
@Controller('v1/workflows')
export class WorkflowsController {
  constructor(@Inject(WorkflowsService) private readonly service: WorkflowsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a durable business process workflow' })
  @ApiResponse({ status: 201, description: 'Workflow started or retrieved if existing' })
  async start(@Body() body: unknown) {
    const parsed = StartWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid workflow start parameters', issues: parsed.error.issues });
    }
    return this.service.startWorkflow(parsed.data);
  }

  @Post(':id/signal')
  @ApiOperation({ summary: 'Send an operational signal (approve, reject, cancel) to an active workflow' })
  @ApiParam({ name: 'id', description: 'Unique workflowId' })
  @ApiResponse({ status: 200, description: 'Signal accepted and workflow status transitioned' })
  @ApiResponse({ status: 404, description: 'Workflow instance not found' })
  async signal(@Param('id') id: string, @Body() body: unknown) {
    const parsed = SignalWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ error: 'Invalid signal parameters', issues: parsed.error.issues });
    }
    return this.service.sendSignal(id, parsed.data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve workflow execution record and state' })
  @ApiParam({ name: 'id', description: 'Unique workflowId' })
  @ApiResponse({ status: 200, description: 'Workflow details retrieved' })
  @ApiResponse({ status: 404, description: 'Workflow instance not found' })
  async getOne(@Param('id') id: string) {
    return this.service.getWorkflow(id);
  }
}
