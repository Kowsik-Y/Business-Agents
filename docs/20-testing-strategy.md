# Testing Strategy

## Test pyramid

### Unit tests

Test pure policy rules, validators, graph routers, document chunking, event serialization, audio conversion, and UI reducers.

### Service integration tests

Run each service against real PostgreSQL, Redis, broker, and Temporal test environments where practical.

### Contract tests

Validate OpenAPI clients, event schemas, tool schemas, provider adapters, and WebSocket event compatibility.

### End-to-end tests

Cover:

```text
product question with citations
order status lookup
missing-information conversation
subscription cancellation confirmation
high-value refund escalation
technical troubleshooting
human handoff
voice turn
voice barge-in
provider outage
```

## AI evaluation

Maintain versioned datasets for:

```text
intent classification
entity extraction
clarifying questions
grounded answers
citation correctness
tool selection
policy compliance
escalation decisions
topic switching
conflicting knowledge
prompt injection
```

Run evaluations before activating prompt, model, retriever, or graph changes.

## Voice evaluation

Measure word error rate, endpoint accuracy, noisy-room robustness, language detection, first-audio latency, interruption success, and audio playback ordering.

## Load testing

Test concurrent chat streams, active WebSockets, STT worker saturation, workflow bursts, retrieval load, and broker backpressure.

## Security testing

Include SAST, dependency scanning, container scanning, secret scanning, DAST, authorization tests, webhook replay, and adversarial AI tests.
