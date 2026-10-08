# Shared Packages

## TypeScript packages

### `packages/contracts`

Transport DTOs, error shapes, enums, and generated OpenAPI clients. No business logic.

### `packages/events`

Event envelope schemas, event names, version helpers, and consumer utilities.

### `packages/ui`

Accessible visual components shared by customer, agent, and admin applications.

### `packages/auth`

Session helpers, token validation, role definitions, and permission primitives.

### `packages/api-client`

Generated internal and public API clients with retry rules only for safe requests.

### `packages/logger`

Structured logging with redaction and correlation IDs.

### `packages/observability`

OpenTelemetry initialization, metric names, trace propagation, and service resource attributes.

## Python packages

### `python-packages/ai-contracts`

Pydantic request, response, tool, and streaming-event models.

### `python-packages/ai-observability`

Tracing wrappers, redaction, model-call metrics, and graph-node instrumentation.

### `python-packages/rag-core`

Shared chunk, metadata, retrieval-result, and reranking interfaces.

### `python-packages/service-auth`

Internal service-token validation and correlation-context extraction.

## Rules

- Shared packages should remain small and stable.
- Do not share database entities across service boundaries.
- Avoid generic `utils` packages.
- Every package has an owner and a compatibility policy.
- Breaking changes require coordinated version upgrades.
