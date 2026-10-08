# Implementation Plan

> **Source of truth:** All section references point to the existing documentation under `docs/` and `adr/`.

---

## 1  Current Repository State

### What exists

| Item | Path | Status |
|---|---|---|
| Root README | `README.md` | ✅ Complete documentation map |
| Architecture docs | `docs/00-system-overview.md` … `docs/25-Docker-roadmap.md` | ✅ 26 documents |
| Architecture decisions | `adr/0001` … `adr/0004` | ✅ 4 ADRs |
| pnpm workspace | `pnpm-workspace.yaml` | ⚠️ Exists but references directories that do not exist yet |
| Turborepo | `turbo.json` | ✅ Valid task definitions |
| Python uv workspace | `pyproject.toml` | ⚠️ Exists but references directories that do not exist yet |

### What does NOT exist

- No `package.json` (root or workspace packages)
- No `apps/` directory (customer-web, agent-console, admin-console)
- No `services/` directory (core-api, ai-orchestrator, knowledge-service, voice-service, workflow-worker, integration-service, notification-service)
- No `packages/` directory (ui, auth, contracts, api-client, events, logger, observability, eslint-config, typescript-config)
- No `python-packages/` directory (ai-contracts, ai-observability, rag-core, service-auth)
- No `infrastructure/` directory (docker, kubernetes, terraform, kong, monitoring)
- No `compose.yaml`
- No `.env.example` files
- No root `package.json` with scripts
- No linting, formatting, or type-checking configuration
- No test configuration
- No Dockerfiles
- No database migrations
- No source code

### Discovered tool versions (local)

```text
Node.js:    v24.14.0
pnpm:       9.15.9
Python:     3.14.5
Docker:     29.1.3
uv:         NOT INSTALLED — blocker for Python workspace
turbo:      NOT INSTALLED — will install as devDependency
```

---

## 2  Documented Services, Applications, and Packages

### Applications (Next.js — `apps/`)

| App | Doc | Port | Technology |
|---|---|---|---|
| customer-web | `docs/03-customer-web.md` | 3000 | Next.js App Router, Tailwind, shadcn/ui, Zustand, TanStack Query |
| agent-console | `docs/04-agent-console.md` | 3001 | Next.js App Router |
| admin-console | `docs/05-admin-console.md` | 3002 | Next.js App Router |

### Services

| Service | Doc | Port | Technology |
|---|---|---|---|
| core-api | `docs/06-core-api.md` | 8000 | NestJS + Fastify, PostgreSQL, Redis |
| ai-orchestrator | `docs/07-ai-orchestrator.md` | 8100 | FastAPI, LangGraph, LangChain, OpenAI SDK |
| knowledge-service | `docs/08-knowledge-service.md` | 8200 | FastAPI, LangChain, pgvector |
| voice-service | `docs/09-voice-service.md` | 8300 | FastAPI, faster-whisper, WebSocket |
| workflow-worker | `docs/10-workflow-worker.md` | — | NestJS or TS, Temporal SDK |
| integration-service | `docs/11-integration-service.md` | — | NestJS, adapters |
| notification-service | `docs/12-notification-service.md` | — | NestJS, templates |

### TypeScript shared packages (`packages/`)

| Package | Doc | Purpose |
|---|---|---|
| contracts | `docs/13-shared-packages.md` | Zod DTOs, error shapes, enums |
| events | `docs/13-shared-packages.md`, `docs/15-event-contracts.md` | Event envelope, catalog, version helpers |
| ui | `docs/13-shared-packages.md` | Shared accessible components |
| auth | `docs/13-shared-packages.md` | Session, token, role, permission primitives |
| api-client | `docs/13-shared-packages.md` | Generated API clients |
| logger | `docs/13-shared-packages.md` | Structured JSON logging, redaction |
| observability | `docs/13-shared-packages.md` | OpenTelemetry init, metrics |
| eslint-config | `docs/13-shared-packages.md` | Shared ESLint rules |
| typescript-config | `docs/13-shared-packages.md` | Shared tsconfig |

### Python shared packages (`python-packages/`)

| Package | Doc | Purpose |
|---|---|---|
| ai-contracts | `docs/13-shared-packages.md` | Pydantic request/response/tool/event models |
| ai-observability | `docs/13-shared-packages.md` | OTel wrappers, model metrics |
| rag-core | `docs/13-shared-packages.md` | Chunk, metadata, retrieval interfaces |
| service-auth | `docs/13-shared-packages.md` | Service token validation |

### Infrastructure (`infrastructure/`)

| Component | Doc | Local tool |
|---|---|---|
| Docker Compose | `docs/19-local-development.md` | compose.yaml |
| Kong config | `docs/02-gateway.md` | kong/ |
| Kubernetes | `docs/22-kubernetes-deployment.md` | kubernetes/ |
| Terraform | `docs/01-monorepo-structure.md` | terraform/ |
| Monitoring | `docs/18-observability.md` | monitoring/ |

### Architecture Decisions

| ADR | Decision |
|---|---|
| 0001 | Next.js is BFF, Kong is the gateway |
| 0002 | LangGraph for AI flow, Temporal for business workflows |
| 0003 | Binary PCM WebSocket for voice MVP |
| 0004 | Modular NestJS Core before microservice splitting |

---

## 3  Dependency Order

```text
1. Root workspace configs + tooling
2. packages/typescript-config
3. packages/eslint-config
4. packages/contracts (Zod schemas — foundation for everything)
5. packages/logger
6. packages/observability
7. packages/auth
8. packages/events
9. packages/api-client
10. python-packages/ai-contracts (Pydantic mirrors of contracts)
11. python-packages/service-auth
12. python-packages/ai-observability
13. python-packages/rag-core
14. infrastructure/docker (compose.yaml)
15. services/core-api (depends on contracts, auth, events, logger, observability)
16. services/integration-service (depends on contracts, events)
17. services/ai-orchestrator (depends on ai-contracts, service-auth, ai-observability)
18. services/knowledge-service (depends on rag-core, ai-contracts, service-auth)
19. services/voice-service (depends on ai-contracts, service-auth, ai-observability)
20. services/workflow-worker (depends on contracts, events)
21. services/notification-service (depends on contracts, events)
22. apps/customer-web (depends on contracts, ui, auth, api-client)
23. apps/agent-console (depends on contracts, ui, auth, api-client)
24. apps/admin-console (depends on contracts, ui, auth, api-client)
25. packages/ui (depends on typescript-config, eslint-config)
```

---

## 4  Implementation Phases

### Phase 0 — Repository Assessment and Workspace Foundation

**Goal:** Bootable monorepo with all workspace scaffolding, tooling, and validation.

**Deliverables:**

- Root `package.json` with workspace scripts
- All workspace directory stubs with their own `package.json` / `pyproject.toml`
- TypeScript, ESLint, Prettier base configs
- Python ruff, pyright base configs
- `.env.example` at root and per-service
- `compose.yaml` with PostgreSQL, Redis, NATS
- Health-check stub pattern
- `docs/implementation-plan.md` and `docs/progress.md`

**Acceptance criteria:**

- [ ] `pnpm install` completes without errors
- [ ] `pnpm lint` runs (may have no files yet but must not crash)
- [ ] `pnpm typecheck` runs
- [ ] `pnpm build` runs for existing packages
- [ ] `uv sync` completes (requires uv installation)
- [ ] `docker compose config` validates
- [ ] All workspace packages are discovered by pnpm
- [ ] All Python workspace members are discovered by uv
- [ ] Root README accurately describes the repository

---

### Phase 1 — Shared Contracts and Local Infrastructure

**Goal:** Typed cross-service contracts and runnable local infrastructure.

**Deliverables:**

- `packages/contracts` — Customer, Conversation, Message, Case, Escalation, AIRequest, AIStreamEvent, ToolRequest, ToolResponse, PolicyDecision, OrderStatus, VoiceSession, VoiceEvents, DomainEvents, APIError Zod schemas
- `python-packages/ai-contracts` — Pydantic mirrors of AI-relevant contracts
- `packages/events` — Event envelope and catalog
- `packages/logger` — Structured JSON logger
- `packages/observability` — OpenTelemetry init
- `packages/auth` — Auth context types and helpers
- `compose.yaml` — PostgreSQL + pgvector, Redis, NATS, Temporal, Temporal UI, MinIO, OTel Collector
- Infrastructure health verification scripts

**Acceptance criteria:**

- [ ] Zod schemas compile and export cleanly
- [ ] Pydantic models validate with mypy/pyright
- [ ] `docker compose up -d` starts all infrastructure
- [ ] PostgreSQL accepts connections with pgvector extension
- [ ] Redis accepts connections
- [ ] Temporal UI accessible at :8088
- [ ] Unit tests pass for all contract packages

**Testing:**

- Unit tests for every Zod schema (valid + invalid inputs)
- Unit tests for every Pydantic model
- Event envelope serialization round-trip tests

---

### Phase 2 — Core API and Database

**Goal:** Working NestJS Core API with conversation and message persistence.

**Deliverables:**

- NestJS application with Fastify adapter
- Database migrations for `customer`, `conversation`, `case_management`, `policy`, `audit` schemas
- Conversation CRUD endpoints
- Message creation and retrieval
- Health endpoints (`/health/live`, `/health/ready`)
- OpenAPI spec generation
- Request validation with Zod
- Correlation ID middleware
- Structured logging

**Acceptance criteria:**

- [ ] `POST /v1/conversations` creates a conversation
- [ ] `POST /v1/conversations/{id}/messages` persists a message
- [ ] `GET /v1/conversations/{id}` returns conversation with messages
- [ ] `/health/live` and `/health/ready` respond correctly
- [ ] OpenAPI spec is generated
- [ ] Database migrations run cleanly
- [ ] Integration tests pass against real PostgreSQL

**Testing:**

- Module unit tests
- Repository integration tests with test database
- API contract tests
- Health endpoint tests

---

### Phase 3 — Mock Integration Service

**Goal:** Integration Service returning mock order data.

**Deliverables:**

- NestJS service with `GET /internal/v1/orders/{orderId}` endpoint
- Mock order repository returning documented test data
- Canonical error mapping
- Health endpoints

**Acceptance criteria:**

- [ ] `GET /internal/v1/orders/ORD-1001` returns the documented mock order
- [ ] Unknown orders return `NOT_FOUND` error
- [ ] Health endpoints work
- [ ] Unit and integration tests pass

**Testing:**

- Order lookup unit tests
- Error mapping tests
- API contract tests

---

### Phase 4 — AI Orchestrator and LangGraph Order Workflow

**Goal:** Working intent classification, entity extraction, missing-info collection, and order-status tool flow.

**Deliverables:**

- FastAPI service with assistant-turn endpoint
- LangGraph conversation graph (classify → missing-info → retrieve → plan → tool-proposal → response)
- Intent classification (order_status)
- Order ID entity extraction
- Missing-field detection and follow-up question generation
- Policy-aware tool proposal (`get_order_status`)
- Tool result integration and grounded response generation
- PostgreSQL-backed LangGraph checkpointer
- OpenAI SDK integration with configurable model
- Streaming SSE response

**Acceptance criteria:**

- [ ] "Where is my order?" → classified as `order_status`
- [ ] Missing order ID → follow-up question generated
- [ ] "ORD-1001" → order ID extracted
- [ ] Tool `get_order_status` proposed with correct arguments
- [ ] Tool result → grounded customer response mentioning carrier and date
- [ ] Conversation state persisted across turns using conversation ID as thread ID
- [ ] Streaming events returned via SSE
- [ ] All tests pass with deterministic mock model

**Testing:**

- Intent classification contract tests
- Order ID extraction tests
- Missing-info routing tests
- Policy authorization tests
- Tool input validation tests
- LangGraph conditional edge tests
- Checkpoint persistence integration test
- Full conversation flow integration test

---

### Phase 5 — Customer Web Text Chat

**Goal:** Browser chat UI connected to the full backend flow.

**Deliverables:**

- Next.js App Router application
- Chat UI with message input and streaming response display
- BFF route handlers (`/api/chat`, `/api/conversations`)
- SSE streaming from BFF to browser
- Conversation state management
- Chat state machine (idle → sending → receiving → completed)

**Acceptance criteria:**

- [ ] User opens chat page
- [ ] User sends "Where is my order?" and sees assistant response
- [ ] Assistant asks for order ID when missing
- [ ] User sends "ORD-1001" and sees order status with carrier and date
- [ ] Messages stream in real-time
- [ ] Conversation persists across page reloads

**Testing:**

- Component tests for chat states
- Route handler tests
- Playwright E2E test for full order-status flow

---

### Phase 6 — Voice Service and Browser Voice Client

**Goal:** Voice conversation using the same order-status workflow.

**Deliverables:**

- FastAPI Voice Service with WebSocket endpoint
- VAD and endpoint detection
- faster-whisper transcription (CPU, small model)
- Sentence-level TTS abstraction with mock provider
- Barge-in handling
- AudioWorklet browser client
- Voice session creation via BFF

**Acceptance criteria:**

- [ ] Browser creates voice session
- [ ] Audio captured and sent as binary PCM WebSocket frames
- [ ] VAD detects speech start/end
- [ ] faster-whisper produces transcript
- [ ] Transcript flows through LangGraph conversation
- [ ] TTS audio returned as binary frames
- [ ] Barge-in cancels active response

**Testing:**

- PCM decoding tests
- VAD/endpoint detection tests
- WebSocket protocol tests
- Sentence accumulation tests
- Barge-in cancellation tests

---

### Phase 7 — Agent Console and Human Handoff

**Goal:** Human agent can receive escalations and continue conversations.

**Deliverables:**

- Agent Console Next.js application
- Handoff queue UI
- Conversation transcript view
- Handoff package display
- Agent message sending
- Core API handoff and case endpoints

**Acceptance criteria:**

- [ ] AI escalation creates a handoff case
- [ ] Agent sees case in queue
- [ ] Agent views full conversation transcript
- [ ] Agent sends message visible to customer

**Testing:**

- Queue assignment tests
- Handoff package tests
- Permission tests
- Playwright E2E test

---

### Phase 8 — Temporal Workflows and Remaining Integrations

**Goal:** Durable business processes for complex operations.

**Deliverables:**

- Temporal workflow worker
- Example order-status workflow
- Integration with Core API workflow management
- Notification service stub

**Acceptance criteria:**

- [ ] Workflow starts from Core API
- [ ] Activities execute against Integration Service
- [ ] Workflow status propagates to conversation

**Testing:**

- Temporal test environment tests
- Workflow determinism tests

---

### Phase 9 — Security and Observability Hardening

**Goal:** Production-grade security controls and telemetry.

**Deliverables:**

- Input validation hardening
- Rate limiting
- Authentication context types
- PII redaction in logs
- Full OpenTelemetry trace propagation
- Grafana dashboards
- Prometheus metrics
- Security audit logging

**Acceptance criteria:**

- [ ] All documented security controls implemented
- [ ] Traces propagate across all services
- [ ] Grafana dashboards display key metrics
- [ ] Audit records created for sensitive operations

**Testing:**

- Security boundary tests
- Trace propagation integration tests
- PII redaction tests

---

### Phase 10 — End-to-End Validation and Deployment Documentation

**Goal:** Full system validation and deployment readiness.

**Deliverables:**

- Complete Playwright E2E test suite
- Kong gateway configuration
- Kubernetes manifests (if needed)
- Deployment documentation
- Runbook validation

**Acceptance criteria:**

- [ ] Full E2E test passes: chat → order status → voice
- [ ] All documented test scenarios covered
- [ ] Deployment documentation complete

**Testing:**

- Full E2E suite
- Load test baseline

---

## 5  Known Risks and Blockers

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **uv not installed** — Python workspace cannot sync | **Blocker** | Install uv before Phase 0 can complete Python setup |
| 2 | **Python 3.14** vs documented 3.12+ — some packages may not yet support 3.14 | Medium | Pin `requires-python = ">=3.12,<3.15"` and test; may need 3.12 |
| 3 | **turbo not installed globally** — will install as devDependency via pnpm | Low | `npx turbo` works after `pnpm install` |
| 4 | **OpenAI API key required for AI Orchestrator** — paid service | Medium | Use mock/deterministic model for tests; real key for manual dev |
| 5 | **faster-whisper on macOS** — CPU mode works but ARM64 wheel availability varies | Medium | Use CPU int8 mode; verify wheel builds |
| 6 | **Docker resource usage** — many containers for full stack | Low | Start minimal; add containers per phase |
| 7 | **Node.js v24** — very new; some packages may lag | Low | Monitor compatibility; downgrade if needed |

---

## 6  Testing Requirements Summary

| Phase | Unit | Integration | E2E |
|---|---|---|---|
| 0 | — | — | Workspace validation commands |
| 1 | Contract schemas | Docker infra health | — |
| 2 | API modules, validators | DB repositories | — |
| 3 | Order mapping | Order API | — |
| 4 | Intent, entity, graph edges | Checkpoint, mock model | — |
| 5 | Chat components, routes | — | Playwright chat flow |
| 6 | Audio, VAD, protocol | WebSocket session | — |
| 7 | Queue, permissions | Handoff flow | Playwright agent flow |
| 8 | Workflow activities | Temporal test env | — |
| 9 | Security rules, redaction | Trace propagation | — |
| 10 | — | — | Full E2E suite |
