# Event Contracts

## Event envelope

```json
{
  "eventId": "EVT-100",
  "eventType": "support.case.escalated",
  "eventVersion": 1,
  "occurredAt": "2026-08-05T07:00:00Z",
  "producer": "core-api",
  "correlationId": "COR-200",
  "traceId": "TRACE-300",
  "subject": "CASE-400",
  "data": {}
}
```

## Event catalog

### Conversation

```text
conversation.created
conversation.message.received
conversation.intent.detected
conversation.response.completed
conversation.closed
```

### Case and handoff

```text
support.case.created
support.case.assigned
support.case.escalated
support.case.resolved
human.approval.requested
human.approval.completed
```

### Knowledge

```text
knowledge.document.uploaded
knowledge.document.indexed
knowledge.document.activated
knowledge.document.retired
knowledge.conflict.detected
```

### Workflow

```text
workflow.started
workflow.waiting
workflow.completed
workflow.failed
workflow.cancelled
```

### Integration

```text
order.status.changed
subscription.cancelled
billing.dispute.created
warranty.claim.created
service.appointment.booked
```

### Notification

```text
notification.queued
notification.delivered
notification.failed
```

## Delivery rules

- Use at-least-once delivery.
- Consumers are idempotent.
- Producers use an outbox pattern.
- Consumers store processed event IDs when side effects are not naturally idempotent.
- Dead-letter queues retain failed events with reason and retry history.

## Schema governance

Keep JSON schemas or protobuf definitions in `packages/events`. Additive fields are backward compatible. Removing or changing meaning requires a new event version.
