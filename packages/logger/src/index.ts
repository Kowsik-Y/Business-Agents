/**
 * @csp/logger — Structured JSON logging with correlation IDs and PII redaction
 * @see docs/18-observability.md
 */

/** Log levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Fields that should be redacted from log output */
const REDACTED_FIELDS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'cookie',
  'ssn',
  'creditcard',
  'cardnumber',
]);

const REDACTED_VALUE = '[REDACTED]';

/** Context carried across log entries */
export interface LogContext {
  serviceName: string;
  environment?: string;
  correlationId?: string;
  traceId?: string;
  conversationId?: string;
  customerId?: string;
  turnId?: string;
  messageId?: string;
  voiceSessionId?: string;
  toolExecutionId?: string;
  workflowId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  [key: string]: unknown;
}

function redactValue(key: string, value: unknown): unknown {
  if (REDACTED_FIELDS.has(key.toLowerCase())) {
    return REDACTED_VALUE;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = redactValue(key, value);
  }
  return result;
}

export class Logger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext, minLevel?: LogLevel) {
    this.context = context;
    this.minLevel = minLevel ?? ((context.environment === 'production' ? 'info' : 'debug') as LogLevel);
  }

  /** Create a child logger with additional context */
  child(extra: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...extra }, this.minLevel);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.context.serviceName,
    };

    // Add context fields (non-undefined only)
    for (const [key, value] of Object.entries(this.context)) {
      if (key !== 'serviceName' && value !== undefined) {
        entry[key] = value;
      }
    }

    // Add and redact data fields
    if (data) {
      const redacted = redactObject(data);
      for (const [key, value] of Object.entries(redacted)) {
        entry[key] = value;
      }
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        process.stderr.write(output + '\n');
        break;
      default:
        process.stdout.write(output + '\n');
        break;
    }
  }
}

/** Create a logger for a service */
export function createLogger(serviceName: string, options?: { level?: LogLevel; environment?: string }): Logger {
  return new Logger(
    {
      serviceName,
      environment: options?.environment ?? process.env['ENVIRONMENT'] ?? 'development',
    },
    options?.level ?? (process.env['LOG_LEVEL'] as LogLevel | undefined),
  );
}

export { redactObject, REDACTED_FIELDS, REDACTED_VALUE };
