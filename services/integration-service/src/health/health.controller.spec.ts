import { describe, it, expect } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns ok for live endpoint', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ok for ready endpoint', () => {
    expect(controller.ready()).toEqual({ status: 'ok', service: 'integration-service' });
  });
});
