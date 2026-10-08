# Observability

## Telemetry stack

- OpenTelemetry SDKs and Collector
- Prometheus-compatible metrics
- Grafana dashboards
- Central structured logs
- Distributed traces
- Optional LangSmith for AI traces and evaluations

## Required context

```text
service.name
environment
trace_id
correlation_id
conversation_id
turn_id
case_id
workflow_id
tool_execution_id
voice_session_id
```

Customer identifiers must be masked or tokenized when not operationally necessary.

## Platform metrics

```text
request count and latency
error rate
queue depth
database latency
cache hit rate
circuit-breaker state
active WebSockets
workflow retries
notification delivery rate
```

## AI metrics

```text
model latency
time to first token
token usage
retrieval latency
retrieval result count
tool proposal rate
tool failure rate
escalation rate
groundedness score
policy violation rate
```

## Voice metrics

```text
active sessions
speech duration
endpoint latency
STT latency
language confidence
TTS first-audio latency
barge-in count
abnormal disconnects
GPU utilization
```

## Logging rules

Use structured JSON logs. Redact authorization headers, passwords, payment data, full transcripts by default, raw audio, and sensitive tool results.

## Alerts

Create alerts for elevated error rates, AI latency, retrieval failure, provider outage, queue growth, GPU saturation, WebSocket disconnect spikes, workflow dead letters, and unauthorized-action attempts.

## Service-level indicators

Recommended SLIs:

```text
chat successful-response rate
chat time to first token
voice time to first audio
business-action completion rate
human-handoff creation rate
knowledge retrieval availability
```
