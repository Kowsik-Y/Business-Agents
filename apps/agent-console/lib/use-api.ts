'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions {
  /** Optional polling interval in milliseconds */
  refreshInterval?: number;
  /** Whether polling is enabled (defaults to true) */
  autoRefresh?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Whether the response came from a backend fallback (service offline) */
  isFallback: boolean;
  /** Re-fetch data manually */
  refetch: () => void;
  /** Last fetched timestamp */
  lastUpdated: Date | null;
}

/**
 * Robust data-fetching hook with polling support for Agent Console.
 * Automatically polls for new cases and queue updates without throwing unhandled rejections.
 */
export function useApi<T>(
  url: string | null,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { refreshInterval = 0, autoRefresh = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!url) {
        setData(null);
        setLoading(false);
        return;
      }

      // Abort previous in-flight request safely
      try {
        abortRef.current?.abort();
      } catch {
        // Ignore
      }

      const controller = new AbortController();
      abortRef.current = controller;

      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        if (!controller.signal.aborted) {
          setData(json as T);
          setIsFallback(Boolean((json as Record<string, unknown>)?._fallback));
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : 'Fetch failed';

        setError(errorMessage);
        setLoading(false);
      }
    },
    [url]
  );

  // Initial fetch on URL change
  useEffect(() => {
    fetchData(false);
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // Ignore
      }
    };
  }, [fetchData]);

  // Polling interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !autoRefresh || !url) {
      return;
    }

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // Don't poll when tab is in background
      }
      void fetchData(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, autoRefresh, url, fetchData]);

  const refetch = useCallback(() => {
    void fetchData(false);
  }, [fetchData]);

  return { data, loading, error, isFallback, refetch, lastUpdated };
}

/**
 * Fire-and-forget mutation helper for PATCH/POST requests in Agent Console.
 */
export async function mutateApi<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      method: options.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { data: null, error: `API error: ${res.status} — ${text}` };
    }
    const json = await res.json();
    return { data: json as T, error: null };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : 'Mutation failed';
    return { data: null, error: errorMessage };
  }
}
