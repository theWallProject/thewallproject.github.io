<?php

/**
 * addon-stats.php — proxy / aggregator for the addon tab of /stats.
 *
 * Mirrors stats.php structurally but targets the browser-addon
 * telemetry site (MATOMO_SITE_ADDON). Delegates shared machinery to
 * stats-common.php and only defines the two addon-specific parsers
 * (parsePageTitleHits, parseEventNameGroups), the ADDON_ACTION_GROUPS
 * map, and the fetchAllAddon() aggregator.
 *
 * Why the addon endpoint differs:
 *   - The addon fires an anonymous page view "wall" once per flagging
 *     banner shown. Actions.getPageTitles filters that row and reads
 *     nb_hits as the total blocks proxy. Matomo's referrer (bg.gif
 *     host) records the blocked domain → Referrers.getWebsites returns
 *     the top blocked sites.
 *   - Addon events share one category/action pair (Button/Click) and
 *     vary by name, so Events.getAction collapses to one row. We use
 *     Events.getName flat=1 (one row per event name) and sum nb_events
 *     per group via ADDON_ACTION_GROUPS to produce investor-friendly
 *     grouped actions (donationClicks, shares, bannerEngagement,
 *     hintEngagement, whatsnewEngagement, whatsnewViews).
 *
 * Contract: same fail-fast / Zod-strict dual validation as stats.php
 * (see docs/STATS.md). Adding a new addon action = one line in
 * ADDON_ACTION_GROUPS + one field in AddonActionsSchema.
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
// ADDON_ACTION_GROUPS — only defined if not already set (allows test
// bootstrap to pre-define constants without "already defined" warnings).
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
    'bannerEngagement' => [
        'show_alternatives',
        'show_bds_guide',
        'support_pal',
        'report_mistake',
    ],
    'hintEngagement' => [
        'hint_link',
        'hint_expand',
        'hint_toggle_system',
        'hint_reset_dismissed',
    ],
    'whatsnewEngagement' => [
        'whatsnew_youtube_telpshow',
        'whatsnew_visit_website',
        'whatsnew_contact',
        'whatsnew_report',
    ],
]);
}

// Event names whose label starts with this prefix roll up into the
// whatsnewViews group regardless of version (e.g.
// `whatsnew_update_1_10_0_to_1_15_2`).
define('ADDON_VIEWS_PREFIX', 'whatsnew_update_');

// -------------------------------------------------------------------------
// Addon-specific parsers — these use the shared Valinor-backed
// parsePageTitleHits() and parseEventNameRows() from stats-common.php.
// The group-summing logic is addon-specific so it stays here.
// -------------------------------------------------------------------------

/**
 * Parse Events.getName flat=1 → grouped action counts. Uses
 * parseEventNameRows() (Valinor-validated) to extract clean event
 * names, then sums nb_events per group via ADDON_ACTION_GROUPS. The
 * whatsnewViews group uses a prefix match for whatsnew_update_*.
 */
function parseEventNameGroups($raw): array
{
    $rows = parseEventNameRows($raw);
    $grouped = [
        'donationClicks' => 0,
        'shares' => 0,
        'bannerEngagement' => 0,
        'hintEngagement' => 0,
        'whatsnewEngagement' => 0,
        'whatsnewViews' => 0,
    ];
    foreach ($rows as $row) {
        $name = $row['name'];
        $events = $row['events'];

        if (str_starts_with($name, ADDON_VIEWS_PREFIX)) {
            $grouped['whatsnewViews'] += $events;
            continue;
        }
        foreach (ADDON_ACTION_GROUPS as $group => $members) {
            if (in_array($name, $members, true)) {
                $grouped[$group] += $events;
                break;
            }
        }
    }
    return $grouped;
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

    // 6. Grouped addon actions — Events.getName flat=1.
    $eventsNameRaw = $client->get('Events.getName', ['period' => 'range', 'date' => $range, 'flat' => '1']);
    $addonActions = parseEventNameGroups($eventsNameRaw);

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
