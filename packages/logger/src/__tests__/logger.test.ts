/**
 * Unit tests for @csp/logger — Structured logging and PII redaction
 */
import { describe, expect, it, vi } from 'vitest';
import { createLogger, Logger, redactObject, REDACTED_VALUE } from '../index.js';

describe('Logger', () => {
  it('creates a logger with service name', () => {
    const logger = createLogger('core-api');
    expect(logger).toBeInstanceOf(Logger);
  });

  it('outputs structured JSON', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = createLogger('test-service', { level: 'info' });

    logger.info('test message', { key: 'value' });

    expect(writeSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(writeSpy.mock.calls[0]![0] as string);
    expect(output.level).toBe('info');
    expect(output.message).toBe('test message');
    expect(output.service).toBe('test-service');
    expect(output.key).toBe('value');
    expect(output.timestamp).toBeDefined();

    writeSpy.mockRestore();
  });

  it('writes errors to stderr', () => {
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test-service');

    logger.error('something failed');

    expect(writeSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(writeSpy.mock.calls[0]![0] as string);
    expect(output.level).toBe('error');

    writeSpy.mockRestore();
  });

  it('respects log level filtering', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = createLogger('test-service', { level: 'warn' });

    logger.debug('should be filtered');
    logger.info('should be filtered');

    expect(writeSpy).not.toHaveBeenCalled();

    writeSpy.mockRestore();
  });

  it('creates child loggers with additional context', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = createLogger('test-service', { level: 'info' });
    const child = logger.child({ conversationId: 'CONV-1', correlationId: 'COR-1' });

    child.info('child log');

    const output = JSON.parse(writeSpy.mock.calls[0]![0] as string);
    expect(output.conversationId).toBe('CONV-1');
    expect(output.correlationId).toBe('COR-1');

    writeSpy.mockRestore();
  });
});

describe('PII redaction', () => {
  it('redacts sensitive fields', () => {
    const result = redactObject({
      username: 'test',
      password: 'secret123',
      token: 'abc',
      apiKey: 'key-123',
      data: 'safe',
    });
    expect(result['password']).toBe(REDACTED_VALUE);
    expect(result['token']).toBe(REDACTED_VALUE);
    expect(result['apiKey']).toBe(REDACTED_VALUE);
    expect(result['username']).toBe('test');
    expect(result['data']).toBe('safe');
  });

  it('redacts nested sensitive fields', () => {
    const result = redactObject({
      user: {
        name: 'Test',
        authorization: 'Bearer xxx',
      },
    });
    const nested = result['user'] as Record<string, unknown>;
    expect(nested['name']).toBe('Test');
    expect(nested['authorization']).toBe(REDACTED_VALUE);
  });
});
