# Monorepo Structure

## Repository layout

```text
customer-success-platform/
├── apps/
│   ├── customer-web/
│   ├── agent-console/
│   └── admin-console/
├── services/
│   ├── core-api/
│   ├── ai-orchestrator/
│   ├── knowledge-service/
│   ├── voice-service/
│   ├── workflow-worker/
│   ├── integration-service/
│   └── notification-service/
├── packages/
│   ├── ui/
│   ├── auth/
│   ├── contracts/
│   ├── api-client/
│   ├── events/
│   ├── logger/
│   ├── observability/
│   ├── eslint-config/
│   └── typescript-config/
├── python-packages/
│   ├── ai-contracts/
│   ├── ai-observability/
│   ├── rag-core/
│   └── service-auth/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   ├── kong/
│   └── monitoring/
├── docs/
├── adr/
├── pnpm-workspace.yaml
├── turbo.json
├── pyproject.toml
├── uv.lock
└── compose.yaml
```

## Workspace policy

- pnpm Workspaces manage JavaScript and TypeScript packages.
- Turborepo runs affected builds, tests, linting, and type checking.
- A uv workspace manages Python services and shared Python packages.
- Each deployable service has its own Dockerfile, health endpoint, configuration schema, tests, and deployment manifest.
- Shared packages contain contracts and cross-cutting utilities, not domain business logic.

## Dependency boundaries

```text
apps/*                    -> packages/*
services/core-api         -> packages/contracts, auth, events, observability
services/workflow-worker  -> packages/contracts, events, observability
services/ai-orchestrator  -> python-packages/*
services/knowledge-service-> python-packages/*
services/voice-service    -> python-packages/*
```

Forbidden dependencies:

- A frontend must not import database packages.
- The AI orchestrator must not import NestJS domain repositories.
- The voice service must not implement customer-support business rules.
- Shared packages must not depend on deployable applications.
- Services must not import another service's private source tree.

## Configuration

Every service validates configuration during startup. Use environment variables for runtime injection and a secrets manager for credentials. Keep `.env.example` files with names only, never real secrets.

Common variables:

```text
SERVICE_NAME
ENVIRONMENT
LOG_LEVEL
OTEL_EXPORTER_OTLP_ENDPOINT
DATABASE_URL
REDIS_URL
NATS_URL
CORE_API_URL
AI_ORCHESTRATOR_URL
```

## Versioning

- HTTP APIs use path-based major versions such as `/v1`.
- Events include `eventVersion`.
- Shared contracts use semantic versioning.
- Breaking contract changes require an ADR and a migration window.
