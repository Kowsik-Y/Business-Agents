# Operational Runbooks

## AI provider outage

1. Confirm provider status and error rate.
2. Activate fallback model or restricted FAQ mode.
3. Disable sensitive automated actions if reasoning quality is uncertain.
4. Route unresolved conversations to human support.
5. Record affected turn IDs for later replay and review.

## Knowledge retrieval failure

1. Check database and vector-index health.
2. Disable unsupported policy answers.
3. Allow only safe transactional lookups that do not require knowledge interpretation.
4. Escalate policy and troubleshooting requests.

## Voice STT saturation

1. Check queue depth and GPU utilization.
2. Scale STT workers.
3. Reduce maximum utterance length if abuse is present.
4. Offer text fallback.
5. Prioritize active calls over batch transcription.

## External billing timeout

1. Do not retry an unknown write blindly.
2. Query provider operation status using the idempotency key.
3. Mark the workflow as waiting or manual review.
4. Inform the customer that confirmation is pending.

## Broker backlog

1. Identify top event types and slow consumers.
2. Scale consumers or pause noncritical producers.
3. Inspect dead-letter queues.
4. Verify idempotency before replay.

## Suspected data exposure

1. Revoke affected credentials and sessions.
2. Preserve logs and audit evidence.
3. Stop affected data flows.
4. Notify security and privacy owners.
5. Follow legal incident-response and notification procedures.

## Prompt regression

1. Roll back the active prompt or graph version.
2. Disable affected tools if necessary.
3. Run the golden evaluation set.
4. Review traces with PII-safe access.
5. Re-enable only after passing regression thresholds.
