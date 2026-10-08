/**
 * Conversation controller — REST endpoints for conversations and messages.
 * @see docs/06-core-api.md, docs/14-api-contracts.md
 */
import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ConversationService } from './conversation.service.js';
import { CreateConversationSchema, CreateMessageSchema } from '@csp/contracts';
import type { CreateConversation, CreateMessage } from '@csp/contracts';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(@Inject(ConversationService) private readonly conversationService: ConversationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        channel: { type: 'string', enum: ['web_chat', 'voice', 'email', 'sms', 'api'] },
        subject: { type: 'string' },
      },
      required: ['customerId'],
    },
  })
  async create(
    @Body(new ZodValidationPipe(CreateConversationSchema)) body: unknown,
  ) {
    return this.conversationService.create(body as CreateConversation);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with messages' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation with messages' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findById(@Param('id') id: string) {
    return this.conversationService.findByIdWithMessages(id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a message to a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', minLength: 1, maxLength: 4000 },
        channel: { type: 'string', enum: ['web_chat', 'voice', 'email', 'sms', 'api'] },
        language: { type: 'string' },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 201, description: 'Message created' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async addMessage(
    @Param('id') conversationId: string,
    @Body(new ZodValidationPipe(CreateMessageSchema)) body: unknown,
  ) {
    return this.conversationService.addMessage(conversationId, body as CreateMessage);
  }
}
