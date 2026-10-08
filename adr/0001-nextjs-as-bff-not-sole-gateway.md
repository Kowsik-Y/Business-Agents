# ADR 0001: Use Next.js as BFF, Not the Sole API Gateway

## Status

Accepted

## Context

The platform needs browser session handling, frontend-specific aggregation, HTTP streaming, WebSocket routing, rate limiting, TLS, WAF integration, and external partner APIs.

## Decision

Use Next.js Route Handlers as a Backend-for-Frontend layer for browser clients. Use Kong or a managed gateway as the external traffic gateway.

## Consequences

Next.js remains focused on browser concerns. Gateway controls remain consistent across web, voice, webhooks, and partner APIs.
