'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Whether the response came from a backend fallback (service offline) */
  isFallback: boolean;
  /** Re-fetch the data manually */
  refetch: () => void;
}

/**
 * Lightweight, robust data-fetching hook for BFF API routes.
 * Fetches JSON from `url` and provides loading/error/data states.
 * Automatically handles abort signals and never leaks events or raw rejections.
 */
export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    // Abort previous in-flight request safely
    try {
      abortRef.current?.abort();
    } catch {
      // Ignore abort error
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
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
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // Ignore
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, isFallback, refetch };
}

/**
 * Fire-and-forget mutate helper for PATCH/POST requests.
 */
export async function mutateApi<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      method: options.method || 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
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
