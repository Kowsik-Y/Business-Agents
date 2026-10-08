import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetricsRegistry,
  redactPii,
  maskCustomerIdentifier,
  sanitizeHeaders,
  sanitizeLogPayload,
  initTelemetry,
  defaultRegistry,
} from '../index.js';

describe('MetricsRegistry & Prometheus Export', () => {
  let registry: MetricsRegistry;

  beforeEach(() => {
    registry = new MetricsRegistry();
  });

  it('records counter increments and exports Prometheus format', () => {
    const counter = registry.createCounter('req_total', 'Count of requests', ['method', 'status']);
    counter.inc(1, { method: 'GET', status: 200 });
    counter.inc(2, { method: 'POST', status: 201 });

    const exported = registry.exportPrometheusMetrics();
    expect(exported).toContain('# HELP req_total Count of requests');
    expect(exported).toContain('# TYPE req_total counter');
    expect(exported).toContain('req_total{method="GET",status="200"} 1');
    expect(exported).toContain('req_total{method="POST",status="201"} 2');
  });

  it('records gauge modifications', () => {
    const gauge = registry.createGauge('active_ws', 'Active WebSockets');
    gauge.set(5);
    gauge.inc(2);
    gauge.dec(1);
    expect(gauge.get()).toBe(6);
  });

  it('records histogram observations and calculates sum/count/buckets', () => {
    const hist = registry.createHistogram('req_latency', 'Latency in seconds', [0.1, 0.5, 1.0]);
    hist.observe(0.05, { route: '/cases' });
    hist.observe(0.2, { route: '/cases' });

    const out = registry.exportPrometheusMetrics();
    expect(out).toContain('req_latency_bucket{route="/cases",le="0.1"} 1');
    expect(out).toContain('req_latency_bucket{route="/cases",le="0.5"} 2');
    expect(out).toContain('req_latency_sum{route="/cases"} 0.25');
    expect(out).toContain('req_latency_count{route="/cases"} 2');
  });

  it('initTelemetry populates default standard platform metrics', () => {
    initTelemetry({ serviceName: 'test', serviceVersion: '0.1.0', environment: 'test' });
    const prom = defaultRegistry.exportPrometheusMetrics();
    expect(prom).toContain('http_requests_total');
    expect(prom).toContain('ai_policy_violations_total');
  });
});

describe('PII and Security Redaction Utilities', () => {
  it('redactPii scrubs credit cards, SSNs, and bearer tokens from strings', () => {
    const sample = 'User sent CC 4532-0123-4567-8901 and SSN 123-45-6789 with token Bearer abc.def.ghi in chat';
    const result = redactPii(sample);
    expect(result).toContain('[REDACTED_CREDIT_CARD]');
    expect(result).toContain('[REDACTED_SSN]');
    expect(result).toContain('Bearer [REDACTED_TOKEN]');
    expect(result).not.toContain('4532-0123-4567-8901');
    expect(result).not.toContain('123-45-6789');
  });

  it('maskCustomerIdentifier masks interior digits of ID', () => {
    expect(maskCustomerIdentifier('CUST-987654321')).toBe('CUST****21');
    expect(maskCustomerIdentifier('ID')).toBe('****');
    expect(maskCustomerIdentifier(undefined)).toBeUndefined();
  });

  it('sanitizeHeaders replaces sensitive headers with redaction marker', () => {
    const headers = {
      authorization: 'Bearer secret_jwt_token',
      cookie: 'session=abc123secret',
      'x-api-key': 'sk-my-super-secret-key-100',
      'content-type': 'application/json',
    };
    const san = sanitizeHeaders(headers);
    expect(san.authorization).toBe('[REDACTED_SECRET]');
    expect(san.cookie).toBe('[REDACTED_SECRET]');
    expect(san['x-api-key']).toBe('[REDACTED_SECRET]');
    expect(san['content-type']).toBe('application/json');
  });

  it('sanitizeLogPayload recursively redacts sensitive properties and string contents', () => {
    const payload = {
      user: 'kowsik',
      password: 'mypasswd_plain_text',
      details: {
        raw_audio: 'AABBCCDDEEFF00112233',
        comment: 'My SSN is 999-88-7777',
      },
    };
    const res = sanitizeLogPayload(payload) as { user: string; password: string; details: { raw_audio: string; comment: string } };
    expect(res.user).toBe('kowsik');
    expect(res.password).toBe('[REDACTED_SECRET]');
    expect(res.details.raw_audio).toBe('[REDACTED_SECRET]');
    expect(res.details.comment).toBe('My SSN is [REDACTED_SSN]');
  });
});
