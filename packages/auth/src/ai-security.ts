/**
 * AI-specific Security Shield and Policy Validation Engine
 * Defends against prompt injections, data exfiltration attempts, and unauthorized tool invocation.
 * @see docs/17-security.md
 */

export interface PromptSecurityAssessment {
  isMalicious: boolean;
  reason?: string;
  matchedPattern?: string;
}

export interface ToolSecurityAssessment {
  valid: boolean;
  reason?: string;
}

// Known adversarial prompt injection and jailbreak heuristic signatures
const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /ignore\s+(?:all\s+)?previous\s+instructions/i, name: 'System override attempt' },
  { pattern: /you\s+are\s+now\s+(?:in\s+)?jailbreak\s+mode/i, name: 'Jailbreak framing' },
  { pattern: /override\s+system\s+prompt/i, name: 'Prompt tampering' },
  { pattern: /disregard\s+your\s+rules/i, name: 'Rule disregard' },
  { pattern: /exfiltrate\s+(?:all\s+)?(?:data|keys|secrets)/i, name: 'Data exfiltration attempt' },
  { pattern: /(?:print|reveal|display)\s+(?:your\s+)?(?:system\s+prompt|api\s+key|private\s+keys)/i, name: 'Secret discovery probe' },
  { pattern: /drop\s+table|delete\s+from\s+[a-z_]+/i, name: 'SQL Injection signature' },
];

const TRAVERSAL_PATTERN = /(\.\.\/|\.\.\\|^\/etc\/|^C:\\\\Windows)/i;
const ARBITRARY_CODE_PATTERN = /(?:eval\s*\(|exec\s*\(|os\.system\s*\()/i;

/**
 * Scan customer or retrieved text for prompt injection and malicious exploits
 */
export function detectPromptInjection(input: string): PromptSecurityAssessment {
  if (!input || typeof input !== 'string') {
    return { isMalicious: false };
  }

  for (const item of PROMPT_INJECTION_PATTERNS) {
    if (item.pattern.test(input)) {
      return {
        isMalicious: true,
        reason: `Adversarial AI security risk detected: ${item.name}`,
        matchedPattern: item.name,
      };
    }
  }

  return { isMalicious: false };
}

/**
 * Validate tool execution request against authentication levels and argument cleanliness
 */
export function validateToolInvocation(
  toolName: string,
  args: Record<string, unknown>,
  currentAuthLevel: number,
  requiredAuthLevel = 0
): ToolSecurityAssessment {
  // 1. Verify Identity level requirements (Level 0 to 3)
  if (currentAuthLevel < requiredAuthLevel) {
    return {
      valid: false,
      reason: `Tool '${toolName}' requires authentication Level ${requiredAuthLevel}, but caller holds Level ${currentAuthLevel}`,
    };
  }

  // 2. Scan string parameters for path traversal or script code injection
  const jsonStr = JSON.stringify(args ?? {});
  if (TRAVERSAL_PATTERN.test(jsonStr)) {
    return {
      valid: false,
      reason: 'Security violation: Suspicious path traversal argument detected in tool payload',
    };
  }

  if (ARBITRARY_CODE_PATTERN.test(jsonStr)) {
    return {
      valid: false,
      reason: 'Security violation: Arbitrary code execution payload prohibited in tool arguments',
    };
  }

  return { valid: true };
}
