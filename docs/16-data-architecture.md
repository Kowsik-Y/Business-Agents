# Data Architecture

## Storage systems

| Store | Purpose |
|---|---|
| PostgreSQL | Durable customer, conversation, case, policy, audit, workflow-reference, and knowledge metadata |
| pgvector | Embeddings and vector similarity search |
| Redis | Sessions, locks, rate limits, cancellation flags, and short-lived caches |
| Object storage | Original documents, sanitized attachments, generated reports, and audio only when retention policy permits |
| Message broker | Domain events and background-job signaling |

## PostgreSQL schemas

```text
customer
conversation
case_management
policy
audit
knowledge
workflow_reference
notification
```

## Key tables

```text
customer.customers
customer.identities
customer.preferences
conversation.conversations
conversation.messages
conversation.turns
conversation.topic_states
case_management.cases
case_management.escalations
policy.tool_policies
policy.approval_rules
audit.action_logs
audit.tool_executions
knowledge.documents
knowledge.document_versions
knowledge.chunks
knowledge.embeddings
workflow_reference.instances
```

## Conversation data

Store original customer messages, normalized text, channel, language, timing, model-generated messages, tool proposals, tool results, and handoff status. Keep prompt internals and private model traces separate from the customer-visible transcript.

## Retention

Create separate policies for:

```text
customer messages
voice audio
transcripts
attachments
model traces
audit records
knowledge documents
business workflow evidence
```

Voice audio should default to no retention or minimal retention unless quality, legal, or contractual needs require it.

## Data ownership

Each schema has one write owner. Read access should be through APIs, events, or restricted read replicas. Avoid cross-service transactional writes.

## Migrations

- Each owning service maintains its migrations.
- Deploy backward-compatible schema changes before application changes.
- Use expand-and-contract for destructive changes.
- Large vector reindexing runs as a versioned background job.
