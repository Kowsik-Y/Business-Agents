# Core API

## Purpose

The NestJS Core API is the authoritative business-facing service for customers, conversations, cases, policies, permissions, handoffs, and audit trails.

## Technology

- NestJS with Fastify adapter
- PostgreSQL
- Redis
- Zod or class-validator for transport validation
- OpenAPI
- OpenTelemetry
- NATS or RabbitMQ event publisher

## Modules

```text
identity
customers
conversations
messages
cases
handoffs
policies
tool-registry
authentication
attachments
audit
```

## Data ownership

The Core API owns writes to:

```text
customer.*
conversation.*
case_management.*
policy.*
audit.*
```

Other services must use APIs or events rather than writing these schemas directly.

## Main APIs

```text
POST   /v1/conversations
GET    /v1/conversations/{id}
POST   /v1/conversations/{id}/messages
GET    /v1/conversations/{id}/stream
POST   /v1/conversations/{id}/handoffs
POST   /v1/cases
GET    /v1/cases/{id}
POST   /v1/tools/{toolName}/authorize
POST   /v1/voice/sessions
POST   /internal/v1/assistant/turns
POST   /internal/v1/tool-results
```

## Assistant-turn workflow

1. Authenticate the channel and customer.
2. Validate and store the incoming message.
3. Load conversation, customer, and relevant business context.
4. Call the AI Orchestrator with a typed request.
5. Validate every proposed tool call.
6. Apply authentication, authorization, policy, idempotency, and confirmation rules.
7. Start a Temporal workflow or invoke a safe synchronous integration.
8. Store assistant events and final response.
9. Publish domain events.

## Tool authorization

The AI never directly receives credentials for CRM, billing, or order systems. It proposes a registered tool call. Core API checks:

```text
schema validity
authentication level
customer ownership
agent role when human-assisted
policy eligibility
confirmation requirement
approval threshold
rate limit
idempotency key
```

## Failure behavior

- Store the customer message before invoking AI.
- Return a resumable stream identifier.
- Mark interrupted or failed assistant turns explicitly.
- Use an outbox table for reliable event publication.
- Never fabricate a successful business action after a timeout.

## Tests

Include module tests, repository integration tests, OpenAPI contract tests, policy decision tables, idempotency tests, outbox tests, and permission tests.
