# Agent Console

## Purpose

The agent console allows human representatives to receive AI escalations, understand the case quickly, continue the conversation, approve controlled actions, and resolve cases.

## Main capabilities

- Handoff queue with routing and priority
- Customer profile and authentication state
- Conversation transcript across channels
- AI-generated summary and unresolved questions
- Relevant orders, subscriptions, warranties, and cases
- Retrieved organizational sources
- Suggested replies and troubleshooting steps
- Tool approval or rejection
- Internal notes invisible to the customer
- Supervisor transfer and case reassignment

## Data flow

```mermaid
sequenceDiagram
    participant A as Agent Console
    participant C as Core API
    participant AI as AI Orchestrator
    participant W as Workflow Worker

    A->>C: Subscribe to assigned conversation
    C-->>A: Conversation and handoff package
    A->>C: Approve proposed action
    C->>W: Resume workflow or start action
    W-->>C: Action result
    C->>AI: Provide tool result
    AI-->>C: Suggested customer response
    C-->>A: Updated case and suggestion
```

## Handoff package

Required fields:

```text
conversationId
caseId
customerId
authenticationLevel
activeIntent
secondaryIntents
sentiment
riskLevel
summary
informationCollected
missingInformation
actionsAttempted
relevantBusinessObjects
retrievedSources
escalationReason
recommendedNextAction
```

## Approval experience

Agents must see the exact proposed tool, validated arguments, business impact, policy reason, and audit implications before approving. Editing arguments must trigger revalidation.

## Security

- Enforce role and queue membership server-side.
- Mask sensitive customer data by role.
- Require stronger authentication for high-risk actions.
- Record all transcript views, exports, approvals, and edits.

## Tests

Test queue assignment, concurrent agent takeover, action approval, stale data, permission denial, transcript redaction, and customer reconnection.
