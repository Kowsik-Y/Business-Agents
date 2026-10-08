# ADR 0004: Modular Core Before Aggressive Microservice Splitting

## Status

Accepted

## Context

Early splitting of every customer-support domain creates operational complexity and distributed transactions before team and scaling boundaries are clear.

## Decision

Begin with a modular NestJS Core API for customer, conversation, case, policy, and audit domains. Keep AI, knowledge, voice, workflow, and gateway as separate services because their workloads and technology needs already differ.

## Consequences

The platform avoids a distributed monolith while preserving clear extraction paths for later service separation.
