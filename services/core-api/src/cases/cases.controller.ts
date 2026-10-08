/**
 * Cases controller — REST endpoints for human agent queue and case handling.
 * @see docs/04-agent-console.md, docs/06-core-api.md
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CasesService } from './cases.service.js';
import {
  CreateCaseSchema,
  UpdateCaseSchema,
  ApproveActionSchema,
  RejectActionSchema,
  CaseFilterSchema,
} from '@csp/contracts';
import type {
  CreateCase,
  UpdateCase,
  ApproveAction,
  RejectAction,
  CaseFilter,
} from '@csp/contracts';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(@Inject(CasesService) private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'List cases for agent handoff queue' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedAgentId', required: false })
  @ApiResponse({ status: 200, description: 'List of cases in queue' })
  async findAll(@Query(new ZodValidationPipe(CaseFilterSchema)) query: CaseFilter) {
    return this.casesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID with handoff package and conversation' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({ status: 200, description: 'Case details with handoff package' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async findById(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new case (escalation handoff)' })
  @ApiResponse({ status: 201, description: 'Case created' })
  async create(
    @Body(new ZodValidationPipe(CreateCaseSchema)) body: unknown,
  ) {
    return this.casesService.create(body as CreateCase);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case (assignment, status, priority, summary)' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({ status: 200, description: 'Case updated' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCaseSchema)) body: unknown,
  ) {
    return this.casesService.update(id, body as UpdateCase);
  }

  @Post(':id/approve-action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a proposed tool action' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({ status: 200, description: 'Action approved' })
  async approveAction(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveActionSchema)) body: unknown,
  ) {
    return this.casesService.approveAction(id, body as ApproveAction);
  }

  @Post(':id/reject-action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a proposed tool action' })
  @ApiParam({ name: 'id', description: 'Case UUID' })
  @ApiResponse({ status: 200, description: 'Action rejected' })
  async rejectAction(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectActionSchema)) body: unknown,
  ) {
    return this.casesService.rejectAction(id, body as RejectAction);
  }
}
