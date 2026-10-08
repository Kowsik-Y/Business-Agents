# MVP Roadmap

## Phase 1 — Grounded chat

Deliver:

```text
customer-web
core-api
ai-orchestrator
knowledge-service
PostgreSQL and pgvector
human handoff
basic agent console
```

Supported use cases:

```text
product questions
pricing questions
order status
basic troubleshooting
ticket creation
human-agent request
```

## Phase 2 — Controlled actions

Add:

```text
Temporal workflow worker
order and subscription adapters
tool authorization
customer confirmations
warranty lookup
service appointment booking
notification service
```

## Phase 3 — Voice

Add:

```text
voice-session API
AudioWorklet capture
WebSocket PCM streaming
faster-whisper
server VAD
sentence-level TTS
barge-in
voice observability
```

## Phase 4 — Production hardening

Add:

```text
multi-region or multi-zone deployment
advanced policy administration
AI regression gates
provider fallback
knowledge governance
security testing
cost controls
capacity planning
```

## Acceptance targets

Initial targets should include:

```text
high grounded-answer rate
zero unauthorized automated actions
clear human escalation for uncertainty
successful conversation-context retention
resumable workflows
observable end-to-end traces
voice first-audio latency suitable for natural interaction
```
