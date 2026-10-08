# Security Architecture

## Identity layers

```text
Level 0: anonymous
Level 1: recognized session
Level 2: OTP or equivalent verification
Level 3: strong authentication
```

Every tool and workflow declares its required level.

## Browser and user authentication

- OpenID Connect or equivalent
- Secure, HttpOnly, SameSite cookies
- CSRF protection
- Short-lived access tokens
- Session revocation
- Device and risk signals for sensitive operations

## Service authentication

Use workload identity, mTLS, or short-lived service tokens. Validate issuer, audience, expiry, and service role. Do not use shared permanent bearer tokens across all services.

## Authorization

Combine role-based and attribute-based controls:

```text
customer ownership
agent queue and role
region
business unit
case assignment
authentication level
tool risk
transaction amount
```

## AI-specific security

- Treat customer content and retrieved documents as untrusted data.
- Separate system instructions from retrieved text.
- Use an allow-listed tool registry.
- Validate structured tool arguments.
- Require policy checks outside the model.
- Block arbitrary URL fetching and arbitrary code execution.
- Detect prompt injection and suspicious data-exfiltration requests.
- Limit graph steps and tool-call count.
- Escalate conflicting or insufficient evidence.

## Privacy

- Encrypt in transit and at rest.
- Redact PII from logs and model traces.
- Minimize data sent to model providers.
- Apply regional processing requirements.
- Do not use customer conversations for training without explicit authorization.
- Support access, correction, deletion, and retention workflows.

## Secrets

Store secrets in a managed secrets system. Rotate provider keys, database credentials, and signing keys. Prevent secrets from entering prompts, logs, or frontend bundles.

## Audit

Record actor, action, resource, policy decision, tool arguments after redaction, result, approval, correlation ID, and timestamp.

## Threat scenarios

Test account takeover, prompt injection, malicious attachments, replayed WebSocket tokens, tool-argument manipulation, cross-customer data access, webhook forgery, provider credential leakage, and abusive request floods.
