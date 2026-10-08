# Business Agent — System Launch Guide

This document provides definitive deployment runbooks, architectural verification schedules, and operational instructions for launching the complete multi-service AI Customer Support platform.

---

## 1. Architecture Summary & Microservices Topology

The platform consists of a synchronized Node.js (TypeScript / NestJS / Next.js 15) and Python 3.12+ (FastAPI / LangGraph / Faster-Whisper) monorepo powered by Turborepo and Docker Compose.

```mermaid
graph TD
    %% Frontend Experience Layer
    CustomerWeb[Customer Web App - Next.js 15<br/>Port 3000]
    AgentConsole[Agent Command Center - Next.js 15<br/>Port 3001]
    AdminConsole[Admin Management Console<br/>Port 3002]

    %% API Gateway & Orchestration Layer
    CoreAPI[Core API Service - NestJS/Fastify<br/>Port 8000]
    Orchestrator[AI Orchestrator - FastAPI/LangGraph<br/>Port 8002]
    VoiceService[Voice Service - Faster-Whisper/TTS<br/>Port 8004]

    %% Backend Services Layer
    Integration[Mock Integration Service - NestJS<br/>Port 8003]
    Notification[Notification Service - NestJS/Email/SMS<br/>Port 8005]
    WorkflowWorker[Temporal Workflow Worker - NestJS/Temporal<br/>Port 8006]

    %% Storage & Infrastructure
    PostgreSql[(PostgreSQL + pgvector<br/>Port 5433)]
    Redis[(Redis Cache & Pub/Sub<br/>Port 6380)]
    Temporal[(Temporal Server & UI<br/>Ports 7233 / 8088)]
    OTel[OpenTelemetry Collector<br/>Port 4318 / 9090]

    %% Flows
    CustomerWeb -->|REST / SSE Streaming| CoreAPI & Orchestrator
    CustomerWeb -->|WebSocket PCM 16kHz| VoiceService
    AgentConsole -->|REST Handoff & Action Approvals| CoreAPI
    CoreAPI -->|Drizzle ORM| PostgreSql
    CoreAPI -->|Workflow Signals| WorkflowWorker
    Orchestrator -->|Tool Calls| Integration
    WorkflowWorker -->|Idempotent Delivery| Notification
    WorkflowWorker -->|Temporal SDK| Temporal
```

---

## 2. Environment Variables & Security Hygiene

Per our strict zero-hardcoded-secret git policy (see `adr/0002-git-hygiene.md`), all API keys, database URLs, and external provider connections are loaded dynamically from environment variables.

### Primary `.env` Configuration Variables:

```bash
# OpenAI-Compatible API Configuration (NavigateLabs AI Dev Cluster)
OPENAI_API_KEY="sk-your_api_key_here"
OPENAI_BASE_URL="https://apidev.navigatelabsai.com/v1"

# Supported High-Performance Models
AI_CHAT_MODEL="gemini-2.5-flash"
AI_VOICE_TTS_MODEL="gemini-2.5-flash-tts"
AI_FAST_REASONING_MODEL="gpt-4o-mini-tts"
AI_NANO_MODEL="gpt-4.1-nano"

# Database & Caching Infrastructure
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/csp_dev?schema=public"
REDIS_URL="redis://localhost:6380/0"
TEMPORAL_ADDRESS="localhost:7233"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

> [!CAUTION]
> Never commit actual secret values or modified production `.env` files into source control. Always verify `.gitignore` excludes `.env*` (except `.env.example`).

---

## 3. Service Directory & Port Map

| Service Name | Package / Path | Framework | Port | Health Probe | Metrics Endpoint | OpenAPI / Docs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Web** | `apps/customer-web` | Next.js 15 App Router | **3000** | `/api/health` | N/A | N/A (Client Portal) |
| **Agent Console** | `apps/agent-console` | Next.js 15 App Router | **3001** | `/api/health` | N/A | N/A (Agent Command) |
| **Admin Console** | `apps/admin-console` | Next.js 15 App Router | **3002** | `/api/health` | N/A | N/A (System Admin) |
| **Core API** | `services/core-api` | NestJS / Fastify | **8000** | `/health/ready` | `/metrics` | `/api-docs` (Swagger) |
| **AI Orchestrator**| `services/ai-orchestrator` | Python FastAPI / LangGraph | **8002** | `/health/ready` | `/health/metrics`| `/docs` (Swagger UI) |
| **Integration** | `services/integration-service`| NestJS / Fastify | **8003** | `/health/ready` | `/metrics` | `/api-docs` (Swagger) |
| **Voice Service** | `services/voice-service` | Python FastAPI / WebSocket | **8004** | `/health/ready` | `/health/metrics`| `/docs` (Swagger UI) |
| **Notification** | `services/notification-service`| NestJS / Fastify / Template | **8005** | `/health/ready` | `/metrics` | `/api-docs` (Swagger) |
| **Workflow Worker**| `services/workflow-worker` | NestJS / Temporal Engine | **8006** | `/health/ready` | `/metrics` | `/api-docs` (Swagger) |

---

## 4. Startup Schedule & Operational Runbook

### Step 1: Boot Local Infrastructure Layer
Launch PostgreSQL (pgvector), Redis, Temporal server, NATS broker, MinIO storage, and OTel Collector:

```bash
docker compose up -d
docker compose ps
```

### Step 2: Run Database Schema Migrations & Initialization
Verify Drizzle schema tables (`customer`, `conversation`, `case_management`, `policy`, `audit`) are properly applied in PostgreSQL:

```bash
pnpm --filter @csp/core-api db:push
```

### Step 3: Launch Services via Turborepo & Uvicorn Dev Mode
Start all backend services and web frontends concurrently with hot-reloading enabled:

```bash
# Terminal 1: Run all TypeScript / Node.js services and web apps
pnpm dev

# Terminal 2: Run Python AI Orchestrator service
cd services/ai-orchestrator && PYTHONPATH="src:../../python-packages/ai-contracts/src" uvicorn ai_orchestrator.main:app --port 8002 --reload

# Terminal 3: Run Python Voice Service
cd services/voice-service && PYTHONPATH="src:../../python-packages/ai-contracts/src" uvicorn voice_service.main:app --port 8004 --reload
```

---

## 5. Verification & E2E Validation Suite

To execute the entire automated system test pyramid (Unit -> Integration -> E2E Lifecycle -> Security Shield):

```bash
# 1. Run TypeScript Monorepo Linter, Typechecker, Build, & Unit/E2E test suite
pnpm test && pnpm build && pnpm typecheck && pnpm lint

# 2. Run Python AI Orchestrator tests (Endpoints, LangGraph State, Security, Intent Classification)
cd services/ai-orchestrator && PYTHONPATH="src:../../python-packages/ai-contracts/src" pytest tests -v

# 3. Run Python Voice Service tests (STT, TTS, VAD Energy Calculation, WebSocket PCM streaming, Barge-In)
cd services/voice-service && PYTHONPATH="src:../../python-packages/ai-contracts/src" pytest tests -v
```

### Key Security & Observability Capabilities Active:
1. **Adversarial AI Defense (Prompt Injection Shield)**: Automatically detects and intercepts jailbreak instructions (`ignore previous instructions`, `override system prompt`, `drop table`), immediately rejecting traffic with HTTP 400/422 and recording policy violation counter metrics.
2. **PII Redaction Engine**: Scrubs social security numbers (`SSN_REGEX`) and credit card patterns (`CREDIT_CARD_REGEX`) from diagnostic traces before exporting to OpenTelemetry collector logs.
3. **Adaptive DDoS Rate Limiter**: Enforces sliding-window IP requests limitations across all public Core API routes, emitting HTTP 429 Too Many Requests when traffic bursts exceed designated quotas.
4. **Prometheus / OTel Exporters**: Exposes `/metrics` in Prometheus format (`text/plain; version=0.0.4`) tracking request counts, turn latency histograms, active Voice WebSockets, and security violations.
5. **Human-in-the-Loop Handoff**: Seamlessly escalates high-risk customer interactions (e.g. refunds > $500, supervisor authorization required) to the 3-column Agent Command Center queue for manual verification and audited tool invocation.
