import { useCallback, useEffect, useRef, useState } from "react";
import type { ZodType } from "zod";

export interface UseStatsBaseResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Generic fetch + hard-validate hook shared by the Website and Addon
 * stats tabs. Each tab calls this with its own `/dynamic/*.php` URL and
 * Zod schema. Tabs therefore keep their loading state completely
 * separate (no shared fetch / no race between tabs).
 *
 * Any schema mismatch throws → surfaces as `error` and the UI renders an
 * error state instead of partial data. Refetch interval is driven by the
 * server's `X-Stats-Cache-Ttl` response header (single source of truth —
 * STATS_CACHE_TTL in stats-common.php). 0 = no polling (live debugging);
 * >0 = poll at that interval.
 */
export function useStatsBase<T>(url: string, schema: ZodType<T>): UseStatsBaseResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      const body: unknown = await res.json();
      if (!res.ok) {
        // Server returns { error: true, message: "...", trace?: "..." }
        if (body && typeof body === "object" && "message" in body) {
          const errObj = body as { message: string; trace?: string };
          setError(errObj.trace ? `${errObj.message}\n${errObj.trace}` : errObj.message);
        } else {
          setError(`HTTP ${res.status} from stats endpoint`);
        }
        return;
      }
      const parsed = schema.parse(body);
      setData(parsed);

      const ttlHeader = res.headers.get("X-Stats-Cache-Ttl");
      const ttl = ttlHeader !== null ? parseInt(ttlHeader, 10) : 0;

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (ttl > 0) {
        timerRef.current = setInterval(doFetch, ttl * 1000);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error fetching stats");
      }
    } finally {
      setLoading(false);
    }
  }, [url, schema]);

  useEffect(() => {
    doFetch();
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [doFetch]);

  return { data, error, loading, refetch: doFetch };
}
