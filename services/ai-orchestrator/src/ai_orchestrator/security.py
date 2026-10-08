"""Security hardening, prompt injection defense, and PII redaction utilities for Python services.
@see docs/17-security.md, docs/18-observability.md
"""

import re

PROMPT_INJECTION_REGEX = re.compile(
    r"(ignore\s+(?:all\s+)?previous\s+instructions|you\s+are\s+now\s+in\s+jailbreak|override\s+system\s+prompt|exfiltrate\s+data|drop\s+table|delete\s+from\s+[a-z_]+)",
    re.IGNORECASE,
)

CREDIT_CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


def detect_prompt_injection(text: str | None) -> tuple[bool, str | None]:
    """Scan input string for adversarial prompt injection signatures."""
    if not text:
        return False, None
    match = PROMPT_INJECTION_REGEX.search(text)
    if match:
        return True, f"Adversarial prompt injection pattern detected: {match.group(0)}"
    return False, None


def redact_pii(text: str | None) -> str:
    """Redact common PII (SSN, Credit Card) from log output and telemetry."""
    if not text:
        return ""
    res = SSN_REGEX.sub("[REDACTED_SSN]", text)
    # Simple replacement for standard credit card formats
    res = CREDIT_CARD_REGEX.sub("[REDACTED_CREDIT_CARD]", res)
    return res
