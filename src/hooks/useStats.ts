import { useCallback, useEffect, useRef, useState } from "react";
import { StatsResponseSchema, type StatsResponse } from "../types/stats";

export interface UseStatsResult {
  data: StatsResponse | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Fetches /dynamic/stats.php and hard-validates the response against
 * StatsResponseSchema. Any schema mismatch throws → surfaces as `error`
 * and the UI renders an error state instead of partial data.
 *
 * Refetch interval is driven by the server's `X-Stats-Cache-Ttl` response
 * header (the single source of truth — STATS_CACHE_TTL in stats.php).
 * 0 = no polling (live debugging); >0 = poll at that interval.
 */
export function useStats(): UseStatsResult {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/dynamic/stats.php", { cache: "no-store" });
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
      const parsed = StatsResponseSchema.parse(body);
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
  }, []);

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
