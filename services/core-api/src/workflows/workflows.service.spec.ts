import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowsService } from './workflows.service.js';
import { NotFoundException } from '@nestjs/common';
import type { Database } from '../db/index.js';

interface MockDb {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
    };
    service = new WorkflowsService(mockDb as unknown as Database);
  });

  describe('startWorkflow', () => {
    it('creates a new workflow instance when none exists', async () => {
      const selectWhereMock = vi.fn().mockResolvedValue([]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      const newInstance = {
        id: 'wf-guid-1',
        workflowId: 'warranty-claim-100',
        workflowType: 'WarrantyClaimWorkflow',
        status: 'waiting_for_approval',
      };

      const returningMock = vi.fn().mockResolvedValue([newInstance]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await service.startWorkflow({
        workflowId: 'warranty-claim-100',
        workflowType: 'WarrantyClaimWorkflow',
        caseId: 'case-100',
      });

      expect(result).toEqual(newInstance);
    });

    it('returns existing instance if workflowId already exists (idempotency)', async () => {
      const existingInstance = {
        id: 'wf-guid-1',
        workflowId: 'warranty-claim-100',
        workflowType: 'WarrantyClaimWorkflow',
        status: 'waiting_for_approval',
      };

      const selectWhereMock = vi.fn().mockResolvedValue([existingInstance]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      const result = await service.startWorkflow({
        workflowId: 'warranty-claim-100',
        workflowType: 'WarrantyClaimWorkflow',
      });

      expect(result).toEqual(existingInstance);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('sendSignal', () => {
    it('updates status to completed on approve signal', async () => {
      const instance = {
        id: 'wf-guid-1',
        workflowId: 'warranty-claim-100',
        status: 'waiting_for_approval',
      };

      const selectWhereMock = vi.fn().mockResolvedValue([instance]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      const updatedInstance = { ...instance, status: 'completed' };
      const returningMock = vi.fn().mockResolvedValue([updatedInstance]);
      const whereUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereUpdateMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const res = await service.sendSignal('warranty-claim-100', { signalName: 'approve' });
      expect(res?.status).toBe('completed');
    });

    it('throws NotFoundException if workflow does not exist when receiving signal', async () => {
      const selectWhereMock = vi.fn().mockResolvedValue([]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      await expect(
        service.sendSignal('non-existent', { signalName: 'approve' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkflow', () => {
    it('returns workflow details by workflowId', async () => {
      const instance = { id: 'wf-1', workflowId: 'order-101', status: 'running' };
      const selectWhereMock = vi.fn().mockResolvedValue([instance]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      const result = await service.getWorkflow('order-101');
      expect(result).toEqual(instance);
    });

    it('throws NotFoundException if workflow Id not found', async () => {
      const selectWhereMock = vi.fn().mockResolvedValue([]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      mockDb.select.mockReturnValue({ from: selectFromMock });

      await expect(service.getWorkflow('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
