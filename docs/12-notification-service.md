# Notification Service

## Purpose

The Notification Service delivers transactional email, SMS, push notifications, and optionally messaging-platform updates.

## Responsibilities

- Versioned templates
- Localization
- Provider abstraction
- Delivery retries
- Suppression and opt-out checks
- Attachment or secure-link handling
- Delivery-status webhooks
- Audit-safe message records

## APIs

```text
POST /internal/v1/notifications
GET  /internal/v1/notifications/{id}
POST /internal/v1/templates
POST /internal/v1/templates/{id}/versions
```

## Request model

```json
{
  "channel": "email",
  "template": "warranty-claim-created",
  "locale": "en-IN",
  "recipient": {"customerId": "CUST-100"},
  "variables": {
    "claimId": "WCL-200",
    "nextStep": "Ship the device using the secure label."
  },
  "idempotencyKey": "warranty-WCL-200-created"
}
```

## Security

Resolve customer contact details inside trusted services. Do not let the AI provide arbitrary recipient addresses for transactional messages. Sanitize template variables and use secure links for sensitive documents.

## Events

```text
notification.queued
notification.sent
notification.delivered
notification.failed
notification.suppressed
```

## Tests

Test localization, variable validation, idempotency, provider failover, suppression, invalid addresses, and webhook authenticity.
