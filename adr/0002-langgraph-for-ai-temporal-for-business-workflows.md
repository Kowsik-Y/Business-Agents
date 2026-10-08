# ADR 0002: LangGraph for AI Flow, Temporal for Business Workflows

## Status

Accepted

## Context

Conversation reasoning and durable business transactions have different consistency, retry, and audit requirements.

## Decision

Use LangGraph for conversational state, routing, retrieval decisions, tool proposals, and human-in-the-loop AI steps. Use Temporal for durable business processes, retries, timers, approvals, and compensation.

## Consequences

The AI may propose an operation, but Core API authorizes it and Temporal or a business service executes it.
