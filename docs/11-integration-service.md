# Integration Service

## Purpose

The Integration Service isolates external systems behind canonical, typed APIs. It prevents AI and frontend services from depending directly on vendor-specific schemas.

## Adapters

```text
crm
orders
billing
subscriptions
warranty
shipping
field-service
identity-verification
```

## Canonical APIs

```text
GET  /internal/v1/customers/{id}/external-profile
GET  /internal/v1/orders/{orderId}
GET  /internal/v1/customers/{id}/transactions
POST /internal/v1/billing/disputes
GET  /internal/v1/subscriptions/{id}
POST /internal/v1/subscriptions/{id}/cancellations
GET  /internal/v1/warranties/eligibility
POST /internal/v1/service-appointments
```

## Responsibilities

- Vendor authentication and secret rotation
- Request and response mapping
- Idempotency enforcement
- Provider-specific retries and circuit breakers
- Webhook verification
- External correlation IDs
- PII minimization
- Provider rate-limit handling
- Canonical error mapping

## Error model

```text
NOT_FOUND
NOT_AUTHORIZED
VALIDATION_FAILED
CONFLICT
RATE_LIMITED
PROVIDER_UNAVAILABLE
PROVIDER_TIMEOUT
MANUAL_REVIEW_REQUIRED
```

Never convert an unknown provider outcome into success. For timed-out writes, query operation status before retrying.

## Caching

Cache read-only reference data where business freshness permits. Do not cache mutable financial decisions without explicit policy.

## Tests

Use provider sandboxes and mock servers. Include contract tests, webhook-signature tests, timeout behavior, duplicate-write protection, and schema-drift alerts.
