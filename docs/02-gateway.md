# Gateway Service

## Purpose

The gateway is the platform's public network boundary. It routes HTTP and WebSocket traffic, terminates TLS, enforces coarse traffic controls, and prevents internal service discovery from leaking to clients.

## Recommended implementation

Use Kong, a managed cloud API gateway, or an ingress controller with equivalent capabilities.

## Public routes

```text
/                       -> customer-web
/agent/*                -> agent-console
/admin/*                -> admin-console
/api/web/*              -> customer-web BFF
/api/agent/*            -> agent-console BFF
/api/public/v1/*        -> core-api public API
/api/webhooks/v1/*      -> integration-service webhook API
/voice/v1/sessions/*    -> voice-service WebSocket and HTTP endpoints
```

## Responsibilities

- TLS termination and certificate rotation
- WAF integration
- Request-size and header-size limits
- IP filtering for administrative endpoints
- Per-route and per-identity rate limits
- WebSocket upgrade and idle-timeout configuration
- Correlation ID generation when absent
- API-key validation for partner integrations
- Coarse JWT verification where appropriate
- Access logging with sensitive-header redaction
- Canary and weighted routing during releases

## Non-responsibilities

The gateway must not decide customer entitlements, refund eligibility, authentication strength, or human-handoff policy. Those remain domain responsibilities.

## Voice configuration

Voice WebSockets require:

- Longer idle timeouts than normal HTTP routes
- Sticky routing only when connection state is local
- Maximum connection duration
- Per-customer concurrent session limits
- Binary-frame support
- Short-lived session token validation
- Protection against oversized or excessive audio frames

## Failure behavior

- Return structured JSON errors for HTTP routes.
- For WebSocket authentication failure, reject before upgrade where possible.
- During downstream overload, return `503` with `Retry-After` for safe retryable operations.
- Never retry non-idempotent write operations automatically at the gateway.

## Metrics

Track request count, latency, status codes, rejected requests, WAF blocks, rate-limit hits, active WebSockets, abnormal disconnects, and upstream health.
