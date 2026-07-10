<?php

/**
 * stats.php — proxy / aggregator for the public /stats page (Website tab).
 *
 * Delegates all shared machinery to stats-common.php and only defines
 * the marketing site (MATOMO_SITE_MARKETING) plus its fetchAllMarketing()
 * aggregation. The addon telemetry lives in addon-stats.php.
 *
 * Contract: any schema mismatch throws StatsSchemaException → the
 * endpoint responds with HTTP 500 + an error envelope. The React client
 * re-validates the same shape with Zod so unknown shapes fail hard on
 * both ends. Adding a new stat = one entry in PHP + one in Zod.
 *
 * Rewrite: /dynamic/stats.json → /dist/dynamic/stats.php  (see .htaccess)
 */

declare(strict_types=1);

// Site IDs for different tracked properties in Matomo.
// Using named constants keeps the code generic and lets us add more
// tracked properties later without touching any other file.
define('MATOMO_SITE_MARKETING', 2); // the-wall.win marketing website
define('MATOMO_SITE_ADDON', 1); // browser addon / app telemetry

// Active site for this endpoint.
define('MATOMO_STATS_SITE_ID', MATOMO_SITE_MARKETING);

require_once __DIR__ . '/stats-common.php';

// -------------------------------------------------------------------------
// Aggregation — marketing site
// -------------------------------------------------------------------------

function fetchAllMarketing(MatomoStatsClient $client): array
{
    $range = STATS_ALL_TIME_START . ',' . STATS_ALL_TIME_END;

    // 1. Visitor totals — six periods
    $today = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'day',   'date' => 'today']), 'today');
    $yest = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'day',   'date' => 'yesterday']), 'yesterday');
    $thisWeek = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'week',  'date' => 'today']), 'thisWeek');
    $monThis = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'month', 'date' => 'today']), 'thisMonth');
    $monLast = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'month', 'date' => 'lastMonth']), 'lastMonth');
    $allTime = parsePeriodSummary($client->get('VisitsSummary.get', ['period' => 'range', 'date' => $range]), 'allTime');

    // 2. Top rankings — all-time range
    $topCountries = parseRankingRows($client->get('UserCountry.getCountry', ['period' => 'range', 'date' => $range]), 'UserCountry.getCountry', STATS_TOP_LIMIT);
    $topContinents = parseRankingRows($client->get('UserCountry.getContinent', ['period' => 'range', 'date' => $range]), 'UserCountry.getContinent', STATS_TOP_LIMIT);
    $topBrowsers = parseRankingRows($client->get('DevicesDetection.getBrowsers', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getBrowsers', STATS_TOP_LIMIT);
    $topOs = parseRankingRows($client->get('DevicesDetection.getOsVersions', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getOsVersions', STATS_TOP_LIMIT);
    $deviceTypes = parseRankingRows($client->get('DevicesDetection.getType', ['period' => 'range', 'date' => $range]), 'DevicesDetection.getType', STATS_TOP_LIMIT);

    // 3. Frequency (new vs returning) — all-time
    $frequency = parseFrequency($client->get('VisitFrequency.get', ['period' => 'range', 'date' => $range]));

    // 4. Referrers
    $referrerTypes = parseRankingRows($client->get('Referrers.getReferrerType', ['period' => 'range', 'date' => $range]), 'Referrers.getReferrerType', STATS_TOP_LIMIT);
    $topWebsites = parseRankingRows($client->get('Referrers.getWebsites', ['period' => 'range', 'date' => $range]), 'Referrers.getWebsites', STATS_TOP_LIMIT);

    // 5. Events — downloads and donations action breakdown. Matomo flat=1
    //    returns rows of { label, secondaryLabel, nb_events }; filter by action name.
    $eventsRaw = $client->get('Events.getAction', ['period' => 'range', 'date' => $range, 'secondaryDimension' => 'eventCategory', 'flat' => '1']);
    $downloads = parseEventActions($eventsRaw, 'download_click');
    $donationsEv = parseEventActions($eventsRaw, 'donation_click');

    // 6. Live counters (last 30 min)
    $liveNow = parseLiveCounters($client->get('Live.getCounters', ['lastMinutes' => 30]));

    // 7. Funding traction — reuses Ko-fi data (shared with addon tab)
    $donationsData = parseDonationsData();

    return [
        'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'site' => 'marketing',
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
        'topWebsites' => $topWebsites,
        'downloads' => $downloads,
        'donations' => $donationsEv,
        'liveNow' => $liveNow,
        'donationsData' => $donationsData,
    ];
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

runEndpoint(MATOMO_STATS_SITE_ID, 'fetchAllMarketing');
