import { z } from "zod";

/**
 * Strict Zod schemas for the /stats endpoint response.
 * Every object uses `.strict()` to reject unknown keys — fail hard on
 * any contract drift so we notice Matomo API changes immediately.
 *
 * These mirror the hand-rolled PHP validators in src/dynamic/stats.php.
 */

// --- Primitives ---

const NonNegIntSchema = z.number().int().nonnegative();
const NonNegFloatSchema = z.number().nonnegative();
const NonEmptyStringSchema = z.string().min(1);

// --- Visitor periods (VisitsSummary.get) ---

export const PeriodSummarySchema = z
  .object({
    visits: NonNegIntSchema,
    uniqueVisitors: NonNegIntSchema,
    actions: NonNegIntSchema,
    bounceRate: NonNegFloatSchema,
    avgVisitDuration: NonNegIntSchema,
  })
  .strict();

export type PeriodSummary = z.infer<typeof PeriodSummarySchema>;

export const VisitorsSchema = z
  .object({
    today: PeriodSummarySchema,
    yesterday: PeriodSummarySchema,
    thisWeek: PeriodSummarySchema,
    thisMonth: PeriodSummarySchema,
    lastMonth: PeriodSummarySchema,
    allTime: PeriodSummarySchema,
  })
  .strict();

/**
 * Ranking row — Matomo getCountry/getBrowsers/etc. return arrays of
 * { label, nb_visits, logo? }. logo is optional (only some methods include it).
 */
export const RankingRowSchema = z
  .object({
    label: NonEmptyStringSchema,
    visits: NonNegIntSchema,
    logo: z.string().optional(),
  })
  .strict();

export type RankingRow = z.infer<typeof RankingRowSchema>;

// --- VisitFrequency.get ---

export const VisitFrequencySchema = z
  .object({
    newVisits: NonNegIntSchema,
    returningVisits: NonNegIntSchema,
  })
  .strict();

export type VisitFrequency = z.infer<typeof VisitFrequencySchema>;

// --- Live.getCounters ---

export const LiveNowSchema = z
  .object({
    visits: NonNegIntSchema,
    actions: NonNegIntSchema,
  })
  .strict();

export type LiveNow = z.infer<typeof LiveNowSchema>;

// --- Events.getAction (download_click / donation_click) ---

export const EventRowSchema = z
  .object({
    label: NonEmptyStringSchema,
    events: NonNegIntSchema,
  })
  .strict();

export type EventRow = z.infer<typeof EventRowSchema>;

// --- donations_data.json (funding traction) ---

export const DonationRowSchema = z
  .object({
    amount: NonNegFloatSchema,
    currency: NonEmptyStringSchema,
    timestamp: NonEmptyStringSchema,
    type: NonEmptyStringSchema,
  })
  .strict();

export type DonationRow = z.infer<typeof DonationRowSchema>;

export const DonationsDataSchema = z
  .object({
    currentMonthly: NonNegFloatSchema,
    donations: z.array(DonationRowSchema),
  })
  .strict();

export type DonationsData = z.infer<typeof DonationsDataSchema>;

// --- Root response (marketing website tab) ---

export const StatsResponseSchema = z
  .object({
    generatedAt: NonEmptyStringSchema,
    site: z.literal("marketing"),
    visitors: VisitorsSchema,
    topCountries: z.array(RankingRowSchema),
    topContinents: z.array(RankingRowSchema),
    topBrowsers: z.array(RankingRowSchema),
    topOs: z.array(RankingRowSchema),
    deviceTypes: z.array(RankingRowSchema),
    visitFrequency: VisitFrequencySchema,
    referrerTypes: z.array(RankingRowSchema),
    topWebsites: z.array(RankingRowSchema),
    downloads: z.array(EventRowSchema),
    donations: z.array(EventRowSchema),
    liveNow: LiveNowSchema,
    donationsData: DonationsDataSchema,
  })
  .strict();

export type StatsResponse = z.infer<typeof StatsResponseSchema>;

// --- Addon telemetry tab (MATOMO_SITE_ADDON) ---
//
// The addon fires an anonymous page view "wall" per banner shown and
// custom events grouped by name. The PHP server-side rolls those events
// into AddonActions (donations, shares, banner/hint/whatsnew engagement
// + changelog views). totalBlocks is the nb_hits of the "wall" page
// title. topBlockedSites are Matomo referrer-type websites (the blocked
// domain is captured as the bg.gif referrer).

export const AddonActionsSchema = z
  .object({
    donationClicks: NonNegIntSchema,
    shares: NonNegIntSchema,
    bannerEngagement: NonNegIntSchema,
    hintEngagement: NonNegIntSchema,
    whatsnewEngagement: NonNegIntSchema,
    whatsnewViews: NonNegIntSchema,
  })
  .strict();

export type AddonActions = z.infer<typeof AddonActionsSchema>;

export const AddonStatsResponseSchema = z
  .object({
    generatedAt: NonEmptyStringSchema,
    site: z.literal("addon"),
    visitors: VisitorsSchema,
    topCountries: z.array(RankingRowSchema),
    topContinents: z.array(RankingRowSchema),
    topBrowsers: z.array(RankingRowSchema),
    topOs: z.array(RankingRowSchema),
    deviceTypes: z.array(RankingRowSchema),
    visitFrequency: VisitFrequencySchema,
    referrerTypes: z.array(RankingRowSchema),
    topBlockedSites: z.array(RankingRowSchema),
    totalBlocks: NonNegIntSchema,
    addonActions: AddonActionsSchema,
    liveNow: LiveNowSchema,
    donationsData: DonationsDataSchema,
  })
  .strict();

export type AddonStatsResponse = z.infer<typeof AddonStatsResponseSchema>;

// --- Error response from stats.php / addon-stats.php on failure ---

export const StatsErrorSchema = z
  .object({
    error: z.literal(true),
    message: z.string(),
    code: z.number().int(),
  })
  .strict();

export type StatsError = z.infer<typeof StatsErrorSchema>;
