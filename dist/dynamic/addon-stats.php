<?php

/**
 * addon-stats.php — proxy / aggregator for the addon tab of /stats.
 *
 * Mirrors stats.php structurally but targets the browser-addon
 * telemetry site (MATOMO_SITE_ADDON). Delegates shared machinery to
 * stats-common.php and only defines the addon-specific parser
 * (parseEventNameGroupsDetailed), the ADDON_ACTION_GROUPS map + the
 * ordered ADDON_*_ACTION_NAMES lists, and the fetchAllAddon() aggregator.
 *
 * Why the addon endpoint differs:
 *   - The addon fires an anonymous page view "wall" once per flagging
 *     banner shown. Actions.getPageTitles filters that row and reads
 *     nb_hit as the total blocks proxy. Matomo's referrer (bg.gif
 *     host) records the blocked domain → Referrers.getWebsites returns
 *     the top blocked sites.
 *   - Addon events share one category/action pair (Button/Click) and
 *     vary by name, so Events.getAction collapses to one row. We use
 *     Events.getName flat=1 (one row per event name) and split the rows
 *     per engagement surface (banner / hint / whats-new page) into
 *     per-name breakdown tables with all-time + this-week + this-month
 *     counts, plus three period-aware headline aggregates
 *     (altClicks = show_alternatives, techForPalestine = support_pal,
 *     hintClicks = hint_link).
 *
 * Contract: same fail-fast / Zod-strict dual validation as stats.php
 * (see docs/STATS.md). Adding a new addon action = one entry in
 * ADDON_ACTION_GROUPS (donations / shares only) or one entry in the
 * relevant ADDON_*_ACTION_NAMES list + one field in AddonActionsSchema.
 *
 * Rewrite: /dynamic/addon-stats.json → /dist/dynamic/addon-stats.php  (see .htaccess)
 */

declare(strict_types=1);

// Reuse the same site-id constants as stats.php for symmetry.
// Guarded for test inclusion (already defined by test bootstrap).
if (!defined('MATOMO_SITE_MARKETING')) {
    define('MATOMO_SITE_MARKETING', 2);
}
if (!defined('MATOMO_SITE_ADDON')) {
    define('MATOMO_SITE_ADDON', 1);
}

// Active site for this endpoint.
if (!defined('MATOMO_STATS_SITE_ID')) {
    define('MATOMO_STATS_SITE_ID', MATOMO_SITE_ADDON);
}

require_once __DIR__ . '/stats-common.php';

// -------------------------------------------------------------------------
// ADDON_ACTION_GROUPS — only the groups that remain as SUMMED totals
// (donations + shares). The banner / hint / whatsnew engagement groups
// were removed when the stats page switched to per-action breakdown
// tables; their per-name rows now live in the ADDON_*_ACTION_NAMES
// lists below and are surfaced via parseEventNameGroupsDetailed().
//
// Only defined if not already set (allows test bootstrap to pre-define
// constants without "already defined" warnings).
// -------------------------------------------------------------------------
if (!defined('ADDON_ACTION_GROUPS')) {
    define('ADDON_ACTION_GROUPS', [
    'donationClicks' => [
        'donation_bricks',
        'options_donate',
        'support_ko_fi',
        'whatsnew_donate_monthly',
        'whatsnew_donation_image',
    ],
    'shares' => [
        'share_fb',
        'share_tw',
        'share_li',
        'share_wa',
        'share_tg',
        'share_ig',
        'options_share_fb',
        'options_share_tw',
        'options_share_li',
        'options_share_wa',
        'options_share_tg',
        'whatsnew_share_fb',
        'whatsnew_share_tw',
        'whatsnew_share_li',
        'whatsnew_share_wa',
        'whatsnew_share_tg',
    ],
]);
}

// -------------------------------------------------------------------------
// ADDON_*_ACTION_NAMES — ordered lists of event names that drive each
// per-action breakdown table on the stats page. Order is irrelevant:
// rows are sorted by all-time count desc by parseEventNameGroupsDetailed.
//
//   bannerActions  : every action the boycott banner can fire. Includes
//                    `dismiss_close` (closing the banner) for completeness
//                    even though it isn't a positive engagement — paired
//                    with the other banner rows it shows the full funnel.
//   hintActions   : every action the hint toast + popup can fire.
//   whatsnewActions: only the pure-engagement whatsnew buttons. The
//                    share / donate buttons on the whatsnew page roll up
//                    into `shares` / `donationClicks` instead, so they do
//                    NOT appear here (matches the original grouping).
// -------------------------------------------------------------------------
if (!defined('ADDON_BANNER_ACTION_NAMES')) {
    define('ADDON_BANNER_ACTION_NAMES', [
    'show_alternatives',
    'show_bds_guide',
    'support_pal',
    'report_mistake',
    'dismiss_close',
    ]);
    define('ADDON_HINT_ACTION_NAMES', [
    'hint_link',
    'hint_expand',
    'hint_dismiss_this',
    'hint_disable_all',
    'hint_toggle_system',
    'hint_reset_dismissed',
    ]);
    define('ADDON_WHATSNEW_ACTION_NAMES', [
    'whatsnew_youtube_telpshow',
    'whatsnew_visit_website',
    'whatsnew_contact',
    'whatsnew_report',
    ]);
}

// Event names whose label starts with this prefix roll up into the
// whatsnewViews group regardless of version (e.g.
// `whatsnew_update_1_10_0_to_1_15_2`). Surfaced as one per-version
// row in the `whatsnewViews` breakdown table (top STATS_TOP_LIMIT).
if (!defined('ADDON_VIEWS_PREFIX')) {
    define('ADDON_VIEWS_PREFIX', 'whatsnew_update_');
}

// Cap the per-version whatsnewViews breakdown table (the all-time
// fixture carries ~30 distinct update pairs; we only show the top N).
if (!defined('ADDON_WHATSNEW_VIEWS_LIMIT')) {
    define('ADDON_WHATSNEW_VIEWS_LIMIT', 5);
}

// -------------------------------------------------------------------------
// Addon-specific parser — replaces the legacy parseEventNameGroups().
// Uses parseEventNameRows() (Valinor-validated) three times — once per
// period snapshot — and merges the (name → nb_events) maps into a
// per-action row carrying { label, allTime, week, month }.
// -------------------------------------------------------------------------

/**
 * Parse three Events.getName flat=1 snapshots (all-time, this-week,
 * this-month) into the detailed period-aware structure consumed by the
 * stats page engagement sections.
 *
 * @param array $rawAll   Events.getName flat=1 for the all-time range
 * @param array $rawWeek  Events.getName flat=1 for period=week date=today
 * @param array $rawMonth Events.getName flat=1 for period=month date=today
 */
function parseEventNameGroupsDetailed($rawAll, $rawWeek, $rawMonth): array
{
    $allMap = eventNameRowsToMap(parseEventNameRows($rawAll));
    $weekMap = eventNameRowsToMap(parseEventNameRows($rawWeek));
    $monthMap = eventNameRowsToMap(parseEventNameRows($rawMonth));

    $buildRows = static function (array $names) use ($allMap, $weekMap, $monthMap): array {
        $out = [];
        foreach ($names as $name) {
            $out[] = [
                'label' => $name,
                'allTime' => $allMap[$name] ?? 0,
                'week' => $weekMap[$name] ?? 0,
                'month' => $monthMap[$name] ?? 0,
            ];
        }
        usort($out, static fn ($a, $b) => $b['allTime'] <=> $a['allTime']);
        return $out;
    };

    $sumPeriod = static function (array $names) use ($allMap, $weekMap, $monthMap): array {
        $allT = $wk = $mo = 0;
        foreach ($names as $name) {
            $allT += $allMap[$name] ?? 0;
            $wk += $weekMap[$name] ?? 0;
            $mo += $monthMap[$name] ?? 0;
        }
        return ['allTime' => $allT, 'week' => $wk, 'month' => $mo];
    };

    $onePeriod = static fn (string $name) => [
        'allTime' => $allMap[$name] ?? 0,
        'week' => $weekMap[$name] ?? 0,
        'month' => $monthMap[$name] ?? 0,
    ];

    $namesByPrefix = static function (string $prefix) use ($allMap): array {
        $out = [];
        foreach (array_keys($allMap) as $name) {
            if (is_string($name) && str_starts_with($name, $prefix)) {
                $out[] = $name;
            }
        }
        return $out;
    };

    $whatsnewViewNames = $namesByPrefix(ADDON_VIEWS_PREFIX);

    // Per-version whatsnew views capped to STATS_TOP_LIMIT by all-time desc.
    $whatsnewViewsRows = $buildRows($whatsnewViewNames);
    $whatsnewViewsRows = array_slice($whatsnewViewsRows, 0, ADDON_WHATSNEW_VIEWS_LIMIT);

    return [
        // Period-aware headline aggregates — REPLACE the legacy single-int
        // bannerEngagement / hintEngagement / whatsnewEngagement / whatsnewViews.
        'donationClicks' => $sumPeriod(ADDON_ACTION_GROUPS['donationClicks']),
        'shares' => $sumPeriod(ADDON_ACTION_GROUPS['shares']),
        'altClicks' => $onePeriod('show_alternatives'),
        'techForPalestine' => $onePeriod('support_pal'),
        'hintClicks' => $onePeriod('hint_link'),
        'whatsnewViewsTotal' => $sumPeriod($whatsnewViewNames),
        'whatsnewEngagementTotal' => $sumPeriod(ADDON_WHATSNEW_ACTION_NAMES),
        // Per-action breakdown tables (all rows, sorted by allTime desc).
        'bannerActions' => $buildRows(ADDON_BANNER_ACTION_NAMES),
        'hintActions' => $buildRows(ADDON_HINT_ACTION_NAMES),
        'whatsnewActions' => $buildRows(ADDON_WHATSNEW_ACTION_NAMES),
        'whatsnewViews' => $whatsnewViewsRows,
    ];
}

/**
 * Convert parseEventNameRows() output [{name, events}, ...] to a
 * name → events map. Names that look like template-literal leakage
 * from the addon (`${...}`) are skipped — they are noise from old
 * addon builds that shipped un-interpolated tracking strings.
 */
function eventNameRowsToMap(array $rows): array
{
    $map = [];
    foreach ($rows as $row) {
        $name = $row['name'];
        if (!is_string($name) || $name === '' || str_contains($name, '${')) {
            continue;
        }
        // Drop accumulation duplicates: if Matomo emits the same name
        // twice (rare; only seen with malformed `Event Name not
        // defined` rows), the last wins.
        $map[$name] = $row['events'];
    }
    return $map;
}

// -------------------------------------------------------------------------
// Aggregation — addon telemetry
// -------------------------------------------------------------------------

function fetchAllAddon(MatomoStatsClient $client): array
{
    $range = STATS_ALL_TIME_START . ',' . STATS_ALL_TIME_END;

    // 1. Visitor totals — six periods (identical calls to marketing)
    $today = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'day',   'date' => 'today']), 'today');
    $yest = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'day',   'date' => 'yesterday']), 'yesterday');
    $thisWeek = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'week',  'date' => 'today']), 'thisWeek');
    $monThis = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'month', 'date' => 'today']), 'thisMonth');
    $monLast = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'month', 'date' => 'lastMonth']), 'lastMonth');
    $allTime = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'range', 'date' => $range]), 'allTime');

    // 2. Top rankings — all-time range (same calls, just different idSite)
    $topCountries = parseRankingRows($client->get('UserCountry.getCountry', ['period' => 'range', 'date' => $range]), 'UserCountry.getCountry', STATS_TOP_LIMIT);
    $topContinents = parseRankingRows($client->get('UserCountry.getContinent', ['period' => 'range', 'date' => $range]), 'UserCountry.getContinent', STATS_TOP_LIMIT);
    $topBrowsers = parseRankingRows($client->get('DevicesDetection.getBrowsers', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getBrowsers', STATS_TOP_LIMIT);
    $topOs = parseRankingRows($client->get('DevicesDetection.getOsVersions', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getOsVersions', STATS_TOP_LIMIT);
    $deviceTypes = parseRankingRows($client->get('DevicesDetection.getType', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getType', STATS_TOP_LIMIT);

    // 3. Frequency (new vs returning) — all-time
    $frequency = parseFrequency($client->get('VisitFrequency.get', ['period' => 'range', 'date' => $range]));

    // 4. Referrer types + top BLOCKED sites. The addon fires bg.gif
    //    from the host page; Matomo captures the blocked site as the
    //    referrer. Referrers.getWebsites returns it directly.
    $referrerTypes = parseRankingRows($client->get('Referrers.getReferrerType', ['period' => 'range', 'date' => $range]), 'Referrers.getReferrerType', STATS_TOP_LIMIT);
    $topBlockedSites = parseRankingRows($client->get('Referrers.getWebsites', ['period' => 'range', 'date' => $range]), 'Referrers.getWebsites', STATS_TOP_LIMIT);

    // 5. Total blocks proxy — page-title hits for the "wall" banner.
    $pageTitlesRaw = $client->get('Actions.getPageTitles', ['period' => 'range', 'date' => $range, 'flat' => '1']);
    $totalBlocks = parsePageTitleHits($pageTitlesRaw, 'wall');

    // 6. Detailed period-aware addon actions — three Events.getName
    //    flat=1 snapshots (all-time range + this-week + this-month).
    //    The week/month calls drive the 3-count columns in the new
    //    engagement breakdown tables on the stats page.
    $eventsNameAll = $client->get('Events.getName', ['period' => 'range', 'date' => $range, 'flat' => '1']);
    $eventsNameWeek = $client->get('Events.getName', ['period' => 'week', 'date' => 'today', 'flat' => '1']);
    $eventsNameMonth = $client->get('Events.getName', ['period' => 'month', 'date' => 'today', 'flat' => '1']);
    $addonActions = parseEventNameGroupsDetailed($eventsNameAll, $eventsNameWeek, $eventsNameMonth);

    // 7. Live counters (last 30 min)
    $liveNow = parseLiveCounters($client->get('Live.getCounters', ['lastMinutes' => 30]));

    // 8. Funding traction — same org-wide Ko-fi data as marketing tab
    $donationsData = parseDonationsData();

    return [
        'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'site' => 'addon',
        'visitors' => [
            'today' => $today,
            'yesterday' => $yest,
            'thisWeek' => $thisWeek,
            'thisMonth' => $monThis,
            'lastMonth' => $monLast,
            'allTime' => $allTime,
        ],
        'topCountries' => $topCountries,
        'topContinents' => $topContinents,
        'topBrowsers' => $topBrowsers,
        'topOs' => $topOs,
        'deviceTypes' => $deviceTypes,
        'visitFrequency' => $frequency,
        'referrerTypes' => $referrerTypes,
        'topBlockedSites' => $topBlockedSites,
        'totalBlocks' => $totalBlocks,
        'addonActions' => $addonActions,
        'liveNow' => $liveNow,
        'donationsData' => $donationsData,
    ];
}

if (!defined('PHPUNIT_COMPOSER_INSTALL')) {
    runEndpoint(MATOMO_STATS_SITE_ID, 'fetchAllAddon');
}
