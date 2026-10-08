import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationService } from './conversation.service.js';
import { NotFoundException } from '@nestjs/common';
import type { Database } from '../db/index.js';

interface MockDb {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe('ConversationService', () => {
  let service: ConversationService;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
    };
    const mockWsService = {
      broadcast: vi.fn(),
    };

    service = new ConversationService(mockDb as any, mockWsService as any);
  });

  describe('create', () => {
    it('inserts a new conversation and returns it', async () => {
      const createdRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '00000000-0000-0000-0000-000000000001',
        channel: 'web_chat',
        subject: 'Inquiry',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([createdRecord]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await service.create({
        customerId: '00000000-0000-0000-0000-000000000001',
        channel: 'web_chat',
        subject: 'Inquiry',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdRecord);
    });
  });

  describe('findById', () => {
    it('returns the conversation if found', async () => {
      const conv = { id: 'conv-1', customerId: 'cust-1' };
      const limitMock = vi.fn().mockResolvedValue([conv]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await service.findById('conv-1');
      expect(result).toEqual(conv);
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIdWithMessages', () => {
    it('returns conversation combined with messages', async () => {
      const conv = { id: 'conv-1', customerId: 'cust-1' };
      const msgs = [{ id: 'msg-1', conversationId: 'conv-1', content: 'Hello' }];

      // mock findById
      const limitMock = vi.fn().mockResolvedValue([conv]);
      const whereMock1 = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock1 = vi.fn().mockReturnValue({ where: whereMock1 });

      // mock messages query
      const orderByMock = vi.fn().mockResolvedValue(msgs);
      const whereMock2 = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock2 = vi.fn().mockReturnValue({ where: whereMock2 });

      mockDb.select
        .mockReturnValueOnce({ from: fromMock1 })
        .mockReturnValueOnce({ from: fromMock2 });

      const result = await service.findByIdWithMessages('conv-1');
      expect(result).toEqual({ ...conv, messages: msgs });
    });
  });

  describe('addMessage', () => {
    it('creates a message and updates conversation updatedAt', async () => {
      const conv = { id: 'conv-1', customerId: 'cust-1' };
      const msg = { id: 'msg-1', conversationId: 'conv-1', content: 'Hello', role: 'customer' };

      // mock findById
      const limitMock = vi.fn().mockResolvedValue([conv]);
      const whereMock1 = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock1 = vi.fn().mockReturnValue({ where: whereMock1 });
      mockDb.select.mockReturnValue({ from: fromMock1 });

      // mock insert message
      const returningMock = vi.fn().mockResolvedValue([msg]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      // mock update conversation
      const whereMock2 = vi.fn().mockResolvedValue([]);
      const setMock = vi.fn().mockReturnValue({ where: whereMock2 });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await service.addMessage('conv-1', {
        content: 'Hello',
        channel: 'web_chat',
        role: 'customer',
      });

      expect(result).toEqual(msg);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
