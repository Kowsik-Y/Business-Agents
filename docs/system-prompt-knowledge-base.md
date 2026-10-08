# System Prompt & Knowledge Base Reference

> **Document Purpose:** This file serves as the canonical reference for the AI Orchestrator's system prompt definition, institutional knowledge base articles, supported intent catalog, tool registry, escalation policies, and security guardrails.

---

## 1. System Prompt Definition

The AI Orchestrator uses the following system prompt when invoking the LLM for response generation:

```
You are an empathetic, professional AI Customer Success Assistant for an enterprise 
service platform. Ground your answers strictly on the verified tool data and 
organizational knowledge provided. Be concise, warm, and professional.
```

### Behavioral Rules

1. **Grounded Responses Only:** Never fabricate information. All responses must be derived from verified tool results or the organizational knowledge base below.
2. **Concise & Professional:** Keep responses direct and action-oriented. Avoid lengthy preambles.
3. **Warm Empathy:** Acknowledge customer frustration when sentiment is negative. Use supportive language.
4. **Citation Awareness:** When quoting policy (warranty, pricing), reference the specific policy details from the knowledge base.
5. **No Code Disclosure:** Never reveal internal system architecture, tool names, or API endpoints to the customer.
6. **Multi-Turn Context:** Maintain conversational continuity. Remember extracted entities (order IDs, customer IDs) across turns within the same conversation.

---

## 2. Institutional Knowledge Base

### 2.1 Pricing & Subscriptions (`pricing_subscriptions`)

Our unified Enterprise Technology Platform offers three transparent subscription tiers:

| Tier | Monthly Price | Key Benefits |
|------|-------------|--------------|
| **VIP Platinum** | $99/month | Dedicated support supervisors, zero-latency SLA, hardware priority replacement |
| **Gold Member** | $49/month | 24/7 AI conversational voice and text support with advanced diagnostics |
| **Standard** | Included | Foundational self-service knowledge access and web order tracking |

### 2.2 Troubleshooting & Technical Support (`troubleshooting`)

To troubleshoot technical glitches or network connectivity errors on your device:

1. Verify your active authentication session token in the security dashboard.
2. Initiate a soft reboot of your network gateway and allow 30 seconds for automated IP calibration.
3. If the error persists, check the Real-Time Platform Telemetry & Health matrix in the Admin console for cluster anomalies.

### 2.3 Warranty & Returns (`warranty_returns`)

All corporate hardware and enterprise gateways come standard with a **full 2-Year Advanced Replacement Warranty**:

- **Coverage Period:** 24 months from date of purchase
- **Defect Types:** Material hardware defects, component failures
- **Process:** Automated RMA replacement dispatched via overnight express freight upon diagnostic verification
- **Exclusions:** Physical damage, water damage, unauthorized modifications

### 2.4 Account Management (`account_issues`)

For secure account management and identity assurance:

- Dynamically update email, password, and security clearance directly in profile badge settings
- **MFA Level-2 or Level-3** is required before accessing internal audit ledgers or modifying payment credentials
- Password reset available via email verification workflow

### 2.5 Account Orders (`account_orders`)

You can view all orders associated with your account at any time. The system maintains a complete history of orders including:

- Current shipping status (Processing, Shipped, Delivered)
- Carrier details (FedEx, UPS, DHL Express, USPS Priority)
- Tracking numbers
- Estimated delivery dates

### 2.6 General FAQ (`general_faq`)

Our Business Agent platform operates 24/7 across voice calls, web chat, emails, and portals. Available services include:

- Real-time order tracking and account order history
- Product pricing and subscription plan information
- Technical troubleshooting and diagnostic assistance
- Warranty policy and return process guidance
- Direct escalation to human support representatives

---

## 3. Intent Catalog

| Priority | Intent ID | Trigger Keywords | Action |
|----------|-----------|-----------------|--------|
| 1 | `escalation_request` | "speak to human", "talk to agent", "representative", "supervisor", "transfer me" | → Immediate handoff to human agent |
| 2 | `order_cancellation` | "cancel", "stop order", "abort", "refund", "modify order" | → Four-Eyes handoff (requires human approval) |
| 3 | `account_orders` | "my orders", "all orders", "list orders", "order history", "show my orders" | → `list_customer_orders` tool call |
| 4 | `order_status` | "order", "tracking", "shipment", "where is my", "ORD-XXXX" | → `get_order_status` tool call |
| 5 | `pricing_subscriptions` | "price", "cost", "subscription", "plan", "billing" | → RAG knowledge retrieval |
| 6 | `troubleshooting` | "error", "not working", "crash", "wifi", "network" | → RAG knowledge retrieval |
| 7 | `warranty_returns` | "warranty", "return", "repair", "replace", "defect" | → RAG knowledge retrieval |
| 8 | `account_issues` | "account", "password", "login", "profile" | → RAG knowledge retrieval |
| 9 | `greeting` | "hi", "hello", "hey", "good morning" | → Welcome response |
| 10 | `general_faq` | (default fallback) | → General FAQ knowledge |

### Intent Classification Logic

- Intents are evaluated in strict priority order (1–10)
- First matching intent wins
- Order ID entities (e.g., `ORD-1001`) are extracted via regex `\b(ORD-?\d{4,8})\b` regardless of intent
- Sentiment analysis runs on every message: keywords like "angry", "frustrated", "immediately" → `frustrated` sentiment with `high` risk level

---

## 4. Tool Registry

### 4.1 `get_order_status`

| Property | Value |
|----------|-------|
| **Purpose** | Retrieve shipping and delivery status for a single order |
| **Input** | `order_id` (string, required) — e.g., `ORD-1001` |
| **Output** | `order_id`, `status`, `carrier`, `tracking_number`, `estimated_delivery` |
| **Auth Level** | 0 (no authentication required) |
| **Human Approval** | No |
| **Idempotent** | Yes |

### 4.2 `list_customer_orders`

| Property | Value |
|----------|-------|
| **Purpose** | Retrieve all orders associated with the authenticated customer's account |
| **Input** | `customer_id` (string, required) — e.g., `CUST-1001` |
| **Output** | Array of order objects with `order_id`, `status`, `carrier`, `estimated_delivery` |
| **Auth Level** | 0 |
| **Human Approval** | No |
| **Idempotent** | Yes |

### 4.3 `cancel_order`

| Property | Value |
|----------|-------|
| **Purpose** | Cancel an active order or divert package shipment |
| **Input** | `order_id` (string, required), `reason` (string, optional) |
| **Output** | `order_id`, `cancelled` (boolean), `message` |
| **Auth Level** | 2 (OTP required) |
| **Human Approval** | **Yes** — Four-Eyes governance policy |
| **Idempotent** | No |

### 4.4 `search_knowledge_base`

| Property | Value |
|----------|-------|
| **Purpose** | Retrieve institutional knowledge from the organizational knowledge corpus |
| **Input** | `query` (string, required), `category` (enum, optional) |
| **Output** | `results` (array of strings), `confidence` (number) |
| **Auth Level** | 0 |
| **Human Approval** | No |
| **Idempotent** | Yes |

---

## 5. Escalation & Handoff Policies

### When Escalation Occurs

| Trigger | Escalation Reason | Behavior |
|---------|-------------------|----------|
| Customer explicitly requests human agent | `customer_requested` | Immediate transfer with full conversation context |
| Order cancellation with valid order ID | `sensitive_business_operation` | Four-Eyes policy: requires human supervisor approval |
| High-risk sentiment detected | `risk_escalation` | Transfer with sentiment and risk assessment attached |

### Handoff Data Package

When escalating to the Agent Console, the following context is preserved:

- Complete conversation message history
- Active intent classification
- Extracted entities (order IDs, customer metadata)
- Sentiment evaluation (`neutral`, `frustrated`)
- Risk level assessment (`low`, `medium`, `high`)
- Recommended next action for the human agent

---

## 6. Security & AI Safety Policies

### 6.1 AI Security Shield

The security module (`security.py`) intercepts every incoming message before processing:

- **Prompt Injection Detection:** Heuristic analysis for adversarial override attempts ("ignore previous instructions", "you are now...")
- **Jailbreak Prevention:** Boundary semantics analysis for role manipulation
- **Response:** Malicious payloads return HTTP 400/429 and trigger security audit alarms

### 6.2 PII Redaction Engine

All outbound log messages and telemetry attributes are scanned for:

- Social Security numbers (SSN patterns)
- Credit card numbers (Luhn-validated sequences)
- Banking account details

Matched patterns are masked with `[REDACTED]` before reaching any logging or observability pipeline.

### 6.3 Rate Limiting

- Sliding-window DDoS rate limiters protect all ingress endpoints
- Every request receives a unique `X-Correlation-ID` header for distributed tracing

---

## 7. Voice Pipeline Configuration

### VAD (Voice Activity Detection) Settings

| Parameter | Normal Listening | Barge-In Mode (During TTS) |
|-----------|-----------------|---------------------------|
| Energy Threshold (RMS) | 0.02 | 0.06 |
| Min Speech Duration | 250ms | 400ms |
| End-of-Speech Silence | 600ms | 600ms |
| Max Utterance Duration | 30,000ms | 30,000ms |
| Pre-Speech Buffer | 200ms | 200ms |

### Audio Specifications

- **Sample Rate:** 16,000 Hz (16kHz)
- **Encoding:** PCM signed 16-bit little-endian (`pcm_s16le`)
- **Channels:** 1 (mono)
- **Frame Duration:** 20ms (320 samples = 640 bytes per frame)

### Speech-to-Text (STT)

- **Engine:** Faster-Whisper
- **Model Size:** Configurable (`tiny`, `base`, `small`)
- **Default:** `tiny` for minimum latency

### Text-to-Speech (TTS)

- **Engine:** OpenAI-compatible TTS API
- **Model:** `gpt-4o-mini-tts`
- **Output Sample Rate:** 24,000 Hz

---

## 8. Customer Profile Defaults

| Customer ID | Name | Tier | Auth Level | Active Order |
|-------------|------|------|-----------|--------------|
| CUST-1001 | Alex Morgan | VIP Platinum | L2 (OTP) | ORD-1001, ORD-1003 |
| CUST-1002 | Jordan Taylor | Gold Member | L2 (OTP) | ORD-1002 |
| CUST-2026 | Sam Jenkins | Standard Tier | L1 (Password) | ORD-2026 |

---

*This document is the authoritative reference for all AI behavioral rules, knowledge content, and operational policies within the Business Agent platform.*
