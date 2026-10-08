# Kubernetes Deployment

## Namespaces

```text
customer-platform-dev
customer-platform-staging
customer-platform-production
```

## Workloads

Each service defines:

```text
Deployment
Service
ConfigMap
Secret references
HorizontalPodAutoscaler
PodDisruptionBudget
NetworkPolicy
ServiceMonitor
```

## Scaling signals

```text
customer-web: request concurrency and CPU
core-api: request latency and CPU
ai-orchestrator: active turns and model latency
knowledge-service: retrieval and indexing queue depth
voice-connection: active WebSockets
stt-worker: queue depth and GPU utilization
workflow-worker: Temporal task queue depth
integration-service: provider latency and queue depth
notification-service: send queue depth
```

## GPU nodes

Place STT workers on dedicated GPU node pools. Add node selectors, tolerations, resource limits, health checks, and one-model-per-worker sizing based on memory.

## Network policies

Examples:

```text
customer-web -> core-api
agent-console -> core-api
core-api -> ai-orchestrator, workflow-worker, integration-service, notification-service
ai-orchestrator -> knowledge-service, core-api
voice-service -> ai-orchestrator, redis
knowledge-service -> postgres, object-storage
```

Deny all unneeded east-west traffic.

## Health endpoints

- Liveness verifies the process can continue.
- Readiness verifies required dependencies and loaded models.
- Startup probes allow slower model initialization.

## Availability

Run stateless HTTP services across availability zones. Use managed highly available PostgreSQL, Redis, broker, and object storage. Configure disruption budgets and topology spread constraints.
