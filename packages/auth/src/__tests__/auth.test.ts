/**
 * Unit tests for @csp/auth — Authentication context and authorization helpers
 */
import { describe, expect, it } from 'vitest';
import {
  meetsAuthLevel,
  hasRole,
  isCustomerOwner,
  anonymousContext,
  serviceContext,
} from '../index.js';
import type { AuthContext } from '../index.js';

describe('meetsAuthLevel', () => {
  it('allows equal level', () => {
    expect(meetsAuthLevel(2, 2)).toBe(true);
  });

  it('allows higher level', () => {
    expect(meetsAuthLevel(3, 1)).toBe(true);
  });

  it('denies lower level', () => {
    expect(meetsAuthLevel(1, 2)).toBe(false);
  });

  it('allows level 0 for level 0 requirement', () => {
    expect(meetsAuthLevel(0, 0)).toBe(true);
  });
});

describe('hasRole', () => {
  const agent: AuthContext = {
    actorId: 'AGENT-1',
    actorType: 'agent',
    authenticationLevel: 3,
    roles: ['support', 'supervisor'],
    isServiceCall: false,
  };

  it('returns true for matching role', () => {
    expect(hasRole(agent, 'support')).toBe(true);
    expect(hasRole(agent, 'supervisor')).toBe(true);
  });

  it('returns false for missing role', () => {
    expect(hasRole(agent, 'admin')).toBe(false);
  });

  it('returns false when no roles', () => {
    const noRoles: AuthContext = {
      actorId: 'CUST-1',
      actorType: 'customer',
      authenticationLevel: 2,
      isServiceCall: false,
    };
    expect(hasRole(noRoles, 'support')).toBe(false);
  });
});

describe('isCustomerOwner', () => {
  it('allows customer to access own data', () => {
    const ctx: AuthContext = {
      actorId: 'CUST-1',
      actorType: 'customer',
      authenticationLevel: 2,
      customerId: 'CUST-1',
      isServiceCall: false,
    };
    expect(isCustomerOwner(ctx, 'CUST-1')).toBe(true);
  });

  it('denies customer accessing another customer', () => {
    const ctx: AuthContext = {
      actorId: 'CUST-1',
      actorType: 'customer',
      authenticationLevel: 2,
      customerId: 'CUST-1',
      isServiceCall: false,
    };
    expect(isCustomerOwner(ctx, 'CUST-2')).toBe(false);
  });

  it('allows agent to access any customer', () => {
    const ctx: AuthContext = {
      actorId: 'AGENT-1',
      actorType: 'agent',
      authenticationLevel: 3,
      roles: ['support'],
      isServiceCall: false,
    };
    expect(isCustomerOwner(ctx, 'CUST-1')).toBe(true);
  });

  it('allows service-to-service calls', () => {
    const ctx = serviceContext('ai-orchestrator');
    expect(isCustomerOwner(ctx, 'CUST-1')).toBe(true);
  });
});

describe('anonymousContext', () => {
  it('creates a level-0 context', () => {
    const ctx = anonymousContext('SESSION-1');
    expect(ctx.authenticationLevel).toBe(0);
    expect(ctx.actorType).toBe('customer');
    expect(ctx.isServiceCall).toBe(false);
    expect(ctx.sessionId).toBe('SESSION-1');
  });
});

describe('serviceContext', () => {
  it('creates a level-3 service context', () => {
    const ctx = serviceContext('core-api');
    expect(ctx.authenticationLevel).toBe(3);
    expect(ctx.actorType).toBe('service');
    expect(ctx.isServiceCall).toBe(true);
    expect(ctx.sourceService).toBe('core-api');
  });
});
