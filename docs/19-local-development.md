# Local Development

## Prerequisites

```text
Node.js
pnpm
Python 3.12+
uv
Docker and Docker Compose
```

GPU support is optional for local voice development.

## Start infrastructure

```bash
docker compose up -d postgres redis nats temporal minio
```

## Install TypeScript dependencies

```bash
pnpm install
```

## Install Python dependencies

```bash
uv sync
```

## Run applications

```bash
pnpm dev
```

Run Python services separately when not managed by Turborepo:

```bash
uv run --package ai-orchestrator uvicorn ai_orchestrator.main:app --reload --port 8100
uv run --package knowledge-service uvicorn knowledge_service.main:app --reload --port 8200
uv run --package voice-service uvicorn voice_service.main:app --reload --port 8300
```

## Suggested local ports

```text
customer-web:       3000
agent-console:      3001
admin-console:      3002
core-api:           8000
ai-orchestrator:    8100
knowledge-service:  8200
voice-service:      8300
temporal-ui:        8088
minio-console:      9001
```

## Local fixtures

Provide seed data for customers, orders, subscriptions, documents, conversations, and cases. Include synthetic audio fixtures for voice tests.

## Developer rules

- Never use production customer data locally.
- Keep provider calls behind configurable adapters.
- Provide mock LLM, STT, TTS, and external-business providers.
- Use deterministic test modes for AI workflows.
