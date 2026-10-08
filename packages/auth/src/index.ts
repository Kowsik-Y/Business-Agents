/**
 * @csp/auth — Authentication context types and helpers
 * @see docs/17-security.md
 */
import { z } from 'zod';

/** Authentication level per docs/17-security.md */
export const AuthLevelSchema = z.union([
  z.literal(0), // anonymous
  z.literal(1), // recognized session
  z.literal(2), // OTP or equivalent
  z.literal(3), // strong authentication
]);

export type AuthLevel = z.infer<typeof AuthLevelSchema>;

/** Actor type — who is making the request */
export const ActorTypeSchema = z.enum(['customer', 'agent', 'admin', 'service', 'system']);
export type ActorType = z.infer<typeof ActorTypeSchema>;

/** Typed authentication context carried on every request */
export interface AuthContext {
  /** Unique actor identifier */
  actorId: string;

  /** Type of actor */
  actorType: ActorType;

  /** Authentication strength level */
  authenticationLevel: AuthLevel;

  /** Customer ID (when actor is a customer or acting on behalf of one) */
  customerId?: string;

  /** Agent roles (when actor is an agent) */
  roles?: string[];

  /** Session ID */
  sessionId?: string;

  /** Whether this is a service-to-service call */
  isServiceCall: boolean;

  /** Source service name (for service-to-service calls) */
  sourceService?: string;
}

/** Verify that the auth level meets the required minimum */
export function meetsAuthLevel(current: AuthLevel, required: AuthLevel): boolean {
  return current >= required;
}

/** Check if an actor has a specific role */
export function hasRole(context: AuthContext, role: string): boolean {
  return context.roles?.includes(role) ?? false;
}

/** Check customer ownership — the actor must be the customer or authorized agent */
export function isCustomerOwner(context: AuthContext, customerId: string): boolean {
  if (context.actorType === 'customer') {
    return context.customerId === customerId;
  }
  if (context.actorType === 'agent' || context.actorType === 'admin') {
    // Agents/admins can access on behalf of customers
    return true;
  }
  if (context.isServiceCall) {
    return true;
  }
  return false;
}

/**
 * Create an anonymous auth context (Level 0).
 * Used for initial connection before authentication.
 */
export function anonymousContext(sessionId?: string): AuthContext {
  return {
    actorId: 'anonymous',
    actorType: 'customer',
    authenticationLevel: 0,
    isServiceCall: false,
    sessionId,
  };
}

/**
 * Create a service-to-service auth context.
 * Used for internal API calls between services.
 */
export function serviceContext(serviceName: string): AuthContext {
  return {
    actorId: serviceName,
    actorType: 'service',
    authenticationLevel: 3,
    isServiceCall: true,
    sourceService: serviceName,
  };
}

export * from './rate-limiter.js';
export * from './ai-security.js';
