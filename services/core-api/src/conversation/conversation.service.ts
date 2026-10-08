/**
 * Conversation service — business logic for conversations and messages.
 * @see docs/06-core-api.md
 */
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module.js';
import type { Database } from '../db/index.js';
import { conversations, messages } from '../db/schema.js';
import type { CreateConversation, CreateMessage } from '@csp/contracts';
import { createLogger } from '@csp/logger';
import { WebSocketService } from '../websocket/websocket.service.js';

const logger = createLogger('core-api').child({ module: 'conversation' });

@Injectable()
export class ConversationService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    @Inject(WebSocketService) private readonly wsService: WebSocketService,
  ) {}

  /** Create a new conversation */
  async create(data: CreateConversation & { id?: string }) {
    const [conversation] = await this.db
      .insert(conversations)
      .values({
        ...(data.id ? { id: data.id } : {}),
        customerId: data.customerId,
        channel: data.channel ?? 'web_chat',
        subject: data.subject,
        metadata: data.metadata,
      })
      .returning();

    logger.info('Conversation created', {
      conversationId: conversation!.id,
      customerId: data.customerId,
    });

    return conversation;
  }

  /** Get a conversation by ID */
  async findById(id: string) {
    const [conversation] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return conversation;
  }

  /** Get a conversation with all its messages */
  async findByIdWithMessages(id: string) {
    const conversation = await this.findById(id);

    const msgs = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return { ...conversation, messages: msgs };
  }

  /** Add a message to a conversation (auto-creates conversation if missing) */
  async addMessage(conversationId: string, data: CreateMessage & { role?: string }) {
    // Ensure conversation exists or auto-create it
    const [existingConv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!existingConv) {
      try {
        await this.db.insert(conversations).values({
          id: conversationId,
          customerId: (data.metadata as any)?.customerId ?? 'CUST-1001',
          channel: data.channel ?? 'web_chat',
          subject: (data.metadata as any)?.subject ?? 'Live Web Chat Session',
        });
      } catch {
        // Ignore if created concurrently
      }
    }

    const [message] = await this.db
      .insert(messages)
      .values({
        conversationId,
        role: (data as any).role ?? 'customer',
        content: data.content,
        channel: data.channel ?? 'web_chat',
        language: data.language,
        metadata: data.metadata,
      })
      .returning();

    logger.info('Message added', {
      conversationId,
      messageId: message!.id,
    });

    // Update conversation updatedAt
    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Broadcast live event via WebSocket
    this.wsService.broadcast({
      type: 'message.created',
      conversationId,
      message,
    });

    return message;
  }
}
