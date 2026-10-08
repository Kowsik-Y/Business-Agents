/**
 * @csp/observability — OpenTelemetry initialization and utilities
 * @see docs/18-observability.md
 *
 * This package provides a lightweight abstraction for initializing
 * OpenTelemetry tracing, metrics, and context propagation.
 * Full OTel SDK dependencies are added in Phase 9; this module
 * provides the interface and correlation-ID utilities now.
 */

/** Standard context attributes propagated across services */
export interface TraceContext {
  traceId?: string;
  correlationId: string;
  conversationId?: string;
  turnId?: string;
  messageId?: string;
  customerId?: string;
  voiceSessionId?: string;
  toolExecutionId?: string;
  workflowId?: string;
  caseId?: string;
}

/** Correlation ID header name */
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const TRACE_ID_HEADER = 'x-trace-id';
export const CONVERSATION_ID_HEADER = 'x-conversation-id';

let _counter = 0;

/** Generate a correlation ID */
export function generateCorrelationId(): string {
  _counter += 1;
  return `COR-${Date.now()}-${_counter}`;
}

/** Generate a unique ID with a prefix */
export function generateId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${Date.now()}-${_counter}`;
}

/** Extract trace context from HTTP headers */
export function extractTraceContext(headers: Record<string, string | string[] | undefined>): Partial<TraceContext> {
  const get = (key: string): string | undefined => {
    const val = headers[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  return {
    correlationId: get(CORRELATION_ID_HEADER) ?? generateCorrelationId(),
    traceId: get(TRACE_ID_HEADER),
    conversationId: get(CONVERSATION_ID_HEADER),
  };
}

/** Inject trace context into outgoing HTTP headers */
export function injectTraceHeaders(context: Partial<TraceContext>): Record<string, string> {
  const headers: Record<string, string> = {};
  if (context.correlationId) headers[CORRELATION_ID_HEADER] = context.correlationId;
  if (context.traceId) headers[TRACE_ID_HEADER] = context.traceId;
  if (context.conversationId) headers[CONVERSATION_ID_HEADER] = context.conversationId;
  return headers;
}

/**
 * Service resource attributes for OTel initialization.
 * Used when setting up the OTel SDK in each service.
 */
export interface ServiceResource {
  serviceName: string;
  serviceVersion: string;
  environment: string;
}

export * from './metrics.js';
export * from './pii.js';

import { defaultRegistry } from './metrics.js';

/**
 * Initialize OTel Telemetry providers and standard platform service metrics.
 */
export function initTelemetry(_resource: ServiceResource): void {
  defaultRegistry.createCounter('http_requests_total', 'Total HTTP requests answered by service', ['method', 'route', 'status_code', 'service']);
  defaultRegistry.createHistogram('http_request_duration_seconds', 'HTTP latency distribution', undefined, ['method', 'route', 'service']);
  defaultRegistry.createCounter('ai_policy_violations_total', 'Count of AI security prompt injections or policy triggers', ['policy_type', 'service']);
  defaultRegistry.createCounter('tool_execution_total', 'Count of tool execution invocations', ['tool_name', 'status', 'service']);
}
