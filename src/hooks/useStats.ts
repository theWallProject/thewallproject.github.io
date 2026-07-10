import { useStatsBase } from "./useStatsBase";
import {
  StatsResponseSchema,
  AddonStatsResponseSchema,
  type StatsResponse,
  type AddonStatsResponse,
} from "../types/stats";

export type UseStatsResult = {
  data: StatsResponse | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
};
export type UseAddonStatsResult = {
  data: AddonStatsResponse | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
};

/**
 * Fetches /dynamic/stats.php and hard-validates the response against
 * StatsResponseSchema. See useStatsBase for the shared fetch / polling
 * / error-envelope logic.
 */
export function useStats(): UseStatsResult {
  return useStatsBase<StatsResponse>("/dynamic/stats.php", StatsResponseSchema);
}

/**
 * Fetches /dynamic/addon-stats.php and hard-validates the response
 * against AddonStatsResponseSchema. Loading stays independent of the
 * Website tab.
 */
export function useAddonStats(): UseAddonStatsResult {
  return useStatsBase<AddonStatsResponse>("/dynamic/addon-stats.php", AddonStatsResponseSchema);
}
