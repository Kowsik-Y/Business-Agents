import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller.js';
import type { Database } from '../db/index.js';

describe('HealthController', () => {
  it('returns ok for liveness probe', () => {
    const mockDb = {} as Database;
    const controller = new HealthController(mockDb);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ok and connected when db executes query successfully', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as Database;

    const controller = new HealthController(mockDb);
    const result = await controller.ready();
    expect(result).toEqual({ status: 'ok', database: 'connected' });
  });

  it('returns degraded and unreachable when db query fails', async () => {
    const mockDb = {
      execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
    } as unknown as Database;

    const controller = new HealthController(mockDb);
    const result = await controller.ready();
    expect(result).toEqual({ status: 'degraded', database: 'unreachable' });
  });

  it('returns Prometheus formatted telemetry text', () => {
    const mockDb = {} as Database;
    const controller = new HealthController(mockDb);
    const metricsText = controller.metrics();
    expect(typeof metricsText).toBe('string');
    expect(metricsText).toContain('http_requests_total');
  });
});
