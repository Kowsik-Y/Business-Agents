/**
 * Rate Limiting Utility against abusive request floods and brute force attempts.
 * @see docs/17-security.md
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

interface WindowRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private readonly windows: Map<string, WindowRecord> = new Map();
  private readonly cleanupIntervalMs = 60_000;
  private lastCleanup = Date.now();

  /**
   * Check if action for a key is allowed within the given rate limit window
   * @param key Unique client identifier (IP address, customerId, API token)
   * @param limit Maximum allowed events in window
   * @param windowMs Duration of time window in milliseconds (e.g., 60_000 for 1 min)
   */
  checkLimit(key: string, limit = 100, windowMs = 60_000): RateLimitResult {
    this.maybeCleanup();
    const now = Date.now();
    let record = this.windows.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.windows.set(key, record);
      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        resetTime: record.resetTime,
        limit,
      };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        limit,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetTime: record.resetTime,
      limit,
    };
  }

  /**
   * Reset rate limit counts for a given key
   */
  reset(key: string): void {
    this.windows.delete(key);
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.lastCleanup = now;
      for (const [k, record] of this.windows.entries()) {
        if (now > record.resetTime) {
          this.windows.delete(k);
        }
      }
    }
  }
}

export const defaultRateLimiter = new RateLimiter();
