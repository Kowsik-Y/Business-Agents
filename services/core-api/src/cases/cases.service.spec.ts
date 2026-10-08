import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CasesService } from './cases.service.js';
import { NotFoundException } from '@nestjs/common';
import type { Database } from '../db/index.js';

interface MockDb {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe('CasesService', () => {
  let service: CasesService;
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

    service = new CasesService(mockDb as any, mockWsService as any, undefined);
  });

  describe('create', () => {
    it('creates a case and returns it', async () => {
      const createdCase = {
        id: 'case-1',
        conversationId: 'conv-1',
        customerId: 'cust-1',
        priority: 'high',
        subject: 'Order issue',
        summary: 'Order issue',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([createdCase]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await service.create({
        conversationId: 'conv-1',
        customerId: 'cust-1',
        priority: 'high',
        subject: 'Order issue',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.id).toBe('case-1');
      expect(result.status).toBe('open');
    });
  });

  describe('findById', () => {
    it('returns the case with handoff package', async () => {
      const caseRecord = {
        id: 'case-1',
        conversationId: 'conv-1',
        customerId: 'cust-1',
        status: 'open',
        priority: 'medium',
        subject: 'Delivery question',
        createdAt: new Date(),
      };

      const custRecord = { id: 'cust-1', name: 'John Doe', email: 'john@example.com' };
      const escRecord = {
        id: 'esc-1',
        caseId: 'case-1',
        summary: 'Customer needs human help',
        reason: 'customer_request',
        createdAt: new Date(),
      };

      // Mock queries
      const limitMockCase = vi.fn().mockResolvedValue([caseRecord]);
      const whereMockCase = vi.fn().mockReturnValue({ limit: limitMockCase });
      const fromMockCase = vi.fn().mockReturnValue({ where: whereMockCase });

      const limitMockCust = vi.fn().mockResolvedValue([custRecord]);
      const whereMockCust = vi.fn().mockReturnValue({ limit: limitMockCust });
      const fromMockCust = vi.fn().mockReturnValue({ where: whereMockCust });

      const limitMockEsc = vi.fn().mockResolvedValue([escRecord]);
      const orderMockEsc = vi.fn().mockReturnValue({ limit: limitMockEsc });
      const whereMockEsc = vi.fn().mockReturnValue({ orderBy: orderMockEsc });
      const fromMockEsc = vi.fn().mockReturnValue({ where: whereMockEsc });

      const orderMockMsg = vi.fn().mockResolvedValue([]);
      const whereMockMsg = vi.fn().mockReturnValue({ orderBy: orderMockMsg });
      const fromMockMsg = vi.fn().mockReturnValue({ where: whereMockMsg });

      const limitMockConv = vi.fn().mockResolvedValue([]);
      const whereMockConv = vi.fn().mockReturnValue({ limit: limitMockConv });
      const fromMockConv = vi.fn().mockReturnValue({ where: whereMockConv });

      mockDb.select
        .mockReturnValueOnce({ from: fromMockCase })
        .mockReturnValueOnce({ from: fromMockCust })
        .mockReturnValueOnce({ from: fromMockEsc })
        .mockReturnValueOnce({ from: fromMockMsg })
        .mockReturnValueOnce({ from: fromMockConv });

      const result = await service.findById('case-1');
      expect(result.id).toBe('case-1');
      expect(result.customer?.name).toBe('John Doe');
      expect(result.handoffPackage).toBeDefined();
      expect(result.handoffPackage.escalationReason).toBe('customer_request');
    });

    it('throws NotFoundException when case does not exist', async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates case fields and status', async () => {
      const caseRecord = {
        id: 'case-1',
        conversationId: 'conv-1',
        customerId: 'cust-1',
        status: 'open',
        priority: 'medium',
        subject: 'Delivery question',
        createdAt: new Date(),
      };

      vi.spyOn(service, 'findById').mockResolvedValue(caseRecord as Awaited<ReturnType<typeof service.findById>>);

      const updatedCase = { ...caseRecord, status: 'resolved' };
      const returningMock = vi.fn().mockResolvedValue([updatedCase]);
      const whereMockUpdate = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMockUpdate });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await service.update('case-1', { status: 'resolved' });
      expect(result?.status).toBe('resolved');
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('approveAction', () => {
    it('logs tool approval in actionLogs', async () => {
      const caseRecord = {
        id: 'case-1',
        conversationId: 'conv-1',
        customerId: 'cust-1',
        assignedAgentId: 'agent-123',
        status: 'open',
        priority: 'medium',
        subject: 'Delivery question',
        createdAt: new Date(),
      };

      vi.spyOn(service, 'findById').mockResolvedValue(caseRecord as Awaited<ReturnType<typeof service.findById>>);

      const createdLog = { id: 'log-1', action: 'approve_tool' };
      const returningMock = vi.fn().mockResolvedValue([createdLog]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await service.approveAction('case-1', {
        toolName: 'process_refund',
        arguments: { amount: 50 },
      });

      expect(result.approved).toBe(true);
      expect(result.toolName).toBe('process_refund');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
