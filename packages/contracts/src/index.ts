/**
 * @csp/contracts — Shared Zod schemas and type exports
 *
 * All cross-service DTOs, error shapes, enums, and transport schemas.
 * Business logic belongs in services, not here.
 *
 * @see docs/13-shared-packages.md
 * @see docs/14-api-contracts.md
 */

// Enums and shared constants
export * from './enums.js';

// Error shape
export * from './errors.js';

// Domain DTOs
export * from './customer.js';
export * from './conversation.js';
export * from './case.js';
export * from './order.js';

// AI contracts
export * from './ai.js';
export * from './tool.js';

// Voice contracts
export * from './voice.js';
