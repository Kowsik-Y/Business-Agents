/**
 * PII Redaction and Sensitive Data Sanitization Utilities
 * @see docs/17-security.md, docs/18-observability.md
 */

// Sensitive field keys to strip completely or mask
const SENSITIVE_KEY_PATTERNS = /^(?:password|secret|token|api_key|apikey|x-api-key|credit_card|ssn|cvv|authorization|cookie|set-cookie|raw_audio|private_key|pin)$/i;

// Regular expressions for string redaction
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const BEARER_TOKEN_REGEX = /Bearer\s+[a-zA-Z0-9-._~+/]+=*/gi;
const API_KEY_REGEX = /(?:sk-|api_key)[a-zA-Z0-9-_]+/gi;

/**
 * Mask customer identifier when not operationally required (e.g. CUST-123456 -> CUST-****56)
 */
export function maskCustomerIdentifier(id: string | undefined): string | undefined {
  if (!id) return undefined;
  if (id.length <= 4) return '****';
  const prefix = id.slice(0, Math.min(4, Math.floor(id.length / 2)));
  const suffix = id.slice(-2);
  return `${prefix}****${suffix}`;
}

/**
 * Redact common PII and credentials from raw string text
 */
export function redactPii(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED_TOKEN]')
    .replace(API_KEY_REGEX, '[REDACTED_KEY]')
    .replace(SSN_REGEX, '[REDACTED_SSN]')
    .replace(CREDIT_CARD_REGEX, (match) => {
      // Basic check to avoid replacing typical timestamps or small integers
      const digitsOnly = match.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 13 && digitsOnly.length <= 16) {
        return '[REDACTED_CREDIT_CARD]';
      }
      return match;
    });
}

/**
 * Sanitize HTTP headers or metadata maps by redacting secrets and tokens
 */
export function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_KEY_PATTERNS.test(key)) {
      sanitized[key] = '[REDACTED_SECRET]';
    } else if (typeof value === 'string') {
      sanitized[key] = redactPii(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Deeply sanitize an unknown payload (JSON log object, tool argument, etc.)
 */
export function sanitizeLogPayload(data: unknown, depth = 0): unknown {
  if (depth > 8 || data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactPii(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogPayload(item, depth + 1));
  }

  if (typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERNS.test(key)) {
        copy[key] = '[REDACTED_SECRET]';
      } else {
        copy[key] = sanitizeLogPayload(val, depth + 1);
      }
    }
    return copy;
  }

  return data;
}
