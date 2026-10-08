# API Contracts

## General conventions

- JSON uses camelCase.
- Timestamps use ISO 8601 UTC.
- IDs are opaque strings.
- APIs are versioned under `/v1`.
- Every request carries `X-Correlation-ID`.
- Mutating retryable requests carry `Idempotency-Key`.
- Errors use a stable machine-readable code.

## Error shape

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "The requested order could not be found.",
    "correlationId": "COR-100",
    "details": {}
  }
}
```

Do not expose provider stack traces or internal hostnames.

## Assistant turn request

```json
{
  "turnId": "TURN-101",
  "conversationId": "CONV-200",
  "customerId": "CUST-300",
  "channel": "web_chat",
  "messageId": "MSG-400",
  "message": "Where is my order?",
  "language": "en-IN",
  "authenticationLevel": 2,
  "context": {
    "recentOrderIds": ["ORD-500"]
  }
}
```

## Assistant streaming events

```text
turn.started
intent.detected
retrieval.started
retrieval.completed
tool.proposed
tool.started
tool.completed
text.delta
handoff.required
turn.completed
turn.failed
```

Each event contains `turnId`, `sequence`, and `timestamp`.

## Tool proposal

```json
{
  "type": "tool.proposed",
  "turnId": "TURN-101",
  "tool": "get_order_status",
  "arguments": {"orderId": "ORD-500"},
  "requiresConfirmation": false,
  "requiresHumanApproval": false
}
```

## Pagination

Use cursor pagination for messages, cases, and audit records.

## Compatibility

Consumers must ignore unknown optional fields. Producers must not change existing field meaning within the same major API version.
