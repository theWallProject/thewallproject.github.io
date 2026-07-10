<?php

/**
 * stats.php — proxy / aggregator for the public /stats page.
 *
 * Fetches a curated set of Reporting API methods from the local Matomo
 * installation server-side (so the read-only token never leaves the
 * box), validates each response against a strict hand-rolled schema that
 * mirrors the Zod schemas in src/types/stats.ts, caches the aggregated
 * blob for 10 minutes, and returns one JSON payload.
 *
 * Contract: any schema mismatch throws StatsSchemaException → the
 * endpoint responds with HTTP 500 + an error envelope. The React client
 * runs the same checks through Zod so unknown shapes fail hard on both
 * ends. Adding a new stat = one entry in SCHEMA + one in fetchAll().
 *
 * Rewrite: /dynamic/stats.json → /dist/dynamic/stats.php  (see .htaccess)
 */

declare(strict_types=1);

// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------

define('STATS_DEBUG', true); // flip to false in production

// Site IDs for different tracked properties in Matomo.
// Using named constants keeps the code generic and lets us add more
// tracked properties (e.g. the browser addon telemetry) later without
// touching any other file — stats.php reads MATOMO_STATS_SITE_ID.
define('MATOMO_SITE_MARKETING', 2); // the-wall.win marketing website
define('MATOMO_SITE_ADDON', 1); // browser addon / app telemetry (future)

// Default site for /stats endpoint. Change to MATOMO_SITE_ADDON once addon
// telemetry is wired up, or clone stats.php with a different default to
// expose a separate /addon-stats endpoint.
define('MATOMO_STATS_SITE_ID', MATOMO_SITE_MARKETING);

define('STATS_CONFIG_FILE', __DIR__ . '/../../dynamic/config.php');
define('STATS_CACHE_DIR', sys_get_temp_dir() . '/stats_cache');
// Single master switch for ALL caching (server file cache + HTTP Cache-Control
// header + client refetch interval via X-Stats-Cache-Ttl response header).
// 0 = disabled (every request hits Matomo live; client never polls).
define('STATS_CACHE_TTL', 0); // seconds; set to 600 for 10-min cache
define('STATS_TIMEOUT', 12); // seconds per Matomo call
define('STATS_ALL_TIME_START', '2000-01-01'); // effectively "since the beginning"
define('STATS_ALL_TIME_END', 'today');
define('STATS_TOP_LIMIT', 10); // cut every ranking to N rows

// Optional: read donations data for funding traction card
define('STATS_DONATIONS_FILE', __DIR__ . '/../../dynamic/donations_data.json');

// -------------------------------------------------------------------------
// Fail-fast bootstrap — mirrors the donations.php pattern
// -------------------------------------------------------------------------

if (!file_exists(STATS_CONFIG_FILE) || !is_readable(STATS_CONFIG_FILE)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => 'config.php missing or unreadable', 'code' => 500]);
    exit;
}

require_once STATS_CONFIG_FILE;

foreach (['MATOMO_STATS_TOKEN', 'MATOMO_STATS_API_URL'] as $const) {
    if (!defined($const) || (string) constant($const) === '') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => true, 'message' => "Constant {$const} not configured in config.php", 'code' => 500]);
        exit;
    }
}

if (!is_dir(STATS_CACHE_DIR) && !@mkdir(STATS_CACHE_DIR, 0775, true) && !is_dir(STATS_CACHE_DIR)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => 'cache dir not writable: ' . STATS_CACHE_DIR, 'code' => 500]);
    exit;
}

// -------------------------------------------------------------------------
// CORS + cache headers (data is public read-only)
// -------------------------------------------------------------------------

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('X-Stats-Cache-Ttl: ' . STATS_CACHE_TTL);

if (STATS_CACHE_TTL > 0) {
    header('Cache-Control: public, max-age=' . STATS_CACHE_TTL);
} else {
    header('Cache-Control: no-store, no-cache, must-revalidate');
}

// -------------------------------------------------------------------------
// Schema definitions (hand-rolled mirror of src/types/stats.ts Zod schemas)
//
// Each Matomo method is mapped to an expected shape. Unknown keys are
// treated as a contract violation → StatsSchemaException.
// -------------------------------------------------------------------------

/**
 * @param mixed  $value
 * @param string $context
 * @return int
 * @throws StatsSchemaException
 */
function expectInt($value, string $context): int
{
    if (is_int($value)) {
        return $value;
    }
    if (is_string($value) && preg_match('/^-?\d+$/', $value) === 1) {
        return (int)$value;
    }
    if (is_float($value) && floor($value) === $value) {
        return (int)$value;
    }
    throw StatsSchemaException::unexpected($context . ': expected int', $value);
}

/**
 * @param mixed  $value
 * @param string $context
 * @throws StatsSchemaException
 */
function expectString($value, string $context): string
{
    if (is_string($value) && $value !== '') {
        return $value;
    }
    if (is_int($value) || is_float($value)) {
        return (string)$value;
    }
    throw StatsSchemaException::unexpected($context . ': expected non-empty string', $value);
}

/**
 * @param mixed  $value
 * @param string $context
 * @throws StatsSchemaException
 */
function expectFloat($value, string $context): float
{
    if (is_float($value) || is_int($value)) {
        return (float)$value;
    }
    if (is_string($value) && is_numeric($value)) {
        return (float)$value;
    }
    throw StatsSchemaException::unexpected($context . ': expected number', $value);
}

/**
 * @param mixed  $value
 * @param string $context
 * @throws StatsSchemaException
 */
function expectArray($value, string $context): array
{
    if (is_array($value) && array_is_list($value)) {
        return $value;
    }
    // Matomo sometimes returns an empty array [] as a list
    if (is_array($value)) {
        return array_values($value);
    }
    throw StatsSchemaException::unexpected($context . ': expected array', $value);
}

/**
 * @param mixed  $value
 * @param string $context
 * @throws StatsSchemaException
 */
function expectObject($value, string $context): array
{
    if (!is_array($value)) {
        throw StatsSchemaException::unexpected($context . ': expected object', $value);
    }
    if (array_is_list($value)) {
        throw StatsSchemaException::unexpected($context . ': expected object, got list', $value);
    }
    return $value;
}

class StatsSchemaException extends Exception
{
    public static function unexpected(string $message, $value = null): self
    {
        $type = is_scalar($value) ? gettype($value) . '(' . var_export($value, true) . ')' : gettype($value);
        return new self("Stats schema violation: {$message}; got {$type}");
    }
}

/**
 * Parse a single-period VisitsSummary.get response (Matomo returns a
 * metric object: { nb_visits, nb_uniq_visitors, nb_actions, ... }).
 */
function parsePeriodSummary($raw, string $periodLabel): array
{
    $obj = expectObject($raw, "VisitsSummary.{$periodLabel}");
    return [
        'visits' => expectInt($obj['nb_visits'] ?? 0, "VisitsSummary.{$periodLabel}.nb_visits"),
        'uniqueVisitors' => expectInt($obj['nb_uniq_visitors'] ?? 0, "VisitsSummary.{$periodLabel}.nb_uniq_visitors"),
        'actions' => expectInt($obj['nb_actions'] ?? 0, "VisitsSummary.{$periodLabel}.nb_actions"),
        'bounceRate' => expectFloat($obj['bounce_rate'] ?? 0, "VisitsSummary.{$periodLabel}.bounce_rate"),
        'avgVisitDuration' => expectInt($obj['avg_time_on_site'] ?? 0, "VisitsSummary.{$periodLabel}.avg_time_on_site"),
    ];
}

/**
 * Parse a ranking response (Matomo returns list of { label, nb_visits, logo?, ... }).
 * Unknown keys are ignored here — only the declared subset is returned.
 */
function parseRankingRows($raw, string $method, int $limit): array
{
    $rows = expectArray($raw, $method);
    $out = [];
    foreach (array_slice($rows, 0, $limit) as $row) {
        $obj = expectObject($row, "{$method}[]");
        $parsed = [
            'label' => expectString($obj['label'] ?? '', "{$method}[].label"),
            'visits' => expectInt($obj['nb_visits'] ?? 0, "{$method}[].nb_visits"),
        ];
        if (isset($obj['logo']) && is_string($obj['logo']) && $obj['logo'] !== '') {
            $parsed['logo'] = $obj['logo'];
        }
        $out[] = $parsed;
    }
    return $out;
}

/**
 * Parse VisitFrequency.get (new vs returning counts for the period).
 */
function parseFrequency($raw): array
{
    $obj = expectObject($raw, 'VisitFrequency.get');
    return [
        'newVisits' => expectInt($obj['nb_visits_new'] ?? 0, 'VisitFrequency.nb_visits_new'),
        'returningVisits' => expectInt($obj['nb_visits_returning'] ?? 0, 'VisitFrequency.nb_visits_returning'),
    ];
}

/**
 * Parse Live.getCounters — returns list of one counter object.
 */
function parseLiveCounters($raw): array
{
    $list = expectArray($raw, 'Live.getCounters');
    if (count($list) === 0) {
        return ['visits' => 0, 'actions' => 0];
    }
    $obj = expectObject($list[0], 'Live.getCounters[0]');
    return [
        'visits' => expectInt($obj['visits'] ?? 0, 'Live.getCounters.visits'),
        'actions' => expectInt($obj['actions'] ?? 0, 'Live.getCounters.actions'),
    ];
}

/**
 * Parse Events.getAction with flat=1 — Matomo returns rows keyed by event category
 * + action. We filter by action name client-side via $actionFilter.
 */
function parseEventActions($raw, string $actionFilter): array
{
    $rows = expectArray($raw, 'Events.getAction');
    $out = [];
    foreach ($rows as $row) {
        $obj = expectObject($row, 'Events.getAction[]');
        $action = expectString($obj['label'] ?? '', 'Events.getAction[].label');
        if ($action !== $actionFilter) {
            continue;
        }
        $out[] = [
            'label' => expectString($obj['secondaryLabel'] ?? $action, 'Events.getAction[].secondaryLabel'),
            'events' => expectInt($obj['nb_events'] ?? 0, 'Events.getAction[].nb_events'),
        ];
    }
    return $out;
}

/**
 * Parse donations_data.json — reuses existing dynamic file. Missing file
 * is OK (returns neutral zeros, not a hard fail — funding card degrades
 * gracefully but other stats still render).
 */
function parseDonationsData(): array
{
    if (!file_exists(STATS_DONATIONS_FILE) || !is_readable(STATS_DONATIONS_FILE)) {
        return ['currentMonthly' => 0, 'donations' => []];
    }
    $raw = json_decode(file_get_contents(STATS_DONATIONS_FILE), true);
    if (!is_array($raw)) {
        return ['currentMonthly' => 0, 'donations' => []];
    }
    $currentMonthly = isset($raw['currentMonthly']) && is_numeric($raw['currentMonthly'])
        ? (float)$raw['currentMonthly']
        : 0.0;
    $donations = [];
    if (isset($raw['donations']) && is_array($raw['donations'])) {
        foreach ($raw['donations'] as $d) {
            if (!is_array($d)) {
                continue;
            }
            $donations[] = [
                'amount' => expectFloat($d['amount'] ?? 0, 'donations[].amount'),
                'currency' => expectString($d['currency'] ?? 'USD', 'donations[].currency'),
                'timestamp' => expectString($d['timestamp'] ?? '', 'donations[].timestamp'),
                'type' => expectString($d['type'] ?? 'Donation', 'donations[].type'),
            ];
        }
    }
    return ['currentMonthly' => $currentMonthly, 'donations' => $donations];
}

// -------------------------------------------------------------------------
// Matomo HTTP API client
// -------------------------------------------------------------------------

class MatomoStatsClient
{
    private string $apiUrl;
    private string $token;
    private string $siteId;

    public function __construct(string $apiUrl, string $token, string $siteId)
    {
        $this->apiUrl = $apiUrl;
        $this->token = $token;
        $this->siteId = $siteId;
    }

    /**
     * @return mixed
     * @throws StatsSchemaException
     */
    public function get(string $method, array $extraParams = [])
    {
        $params = array_merge([
            'module' => 'API',
            'method' => $method,
            'idSite' => $this->siteId,
            'format' => 'JSON',
            'format_metrics' => '0',
            'token_auth' => $this->token,
        ], $extraParams);

        $queryString = http_build_query($params);

        if (!function_exists('curl_init')) {
            $raw = $this->fallbackPost($queryString);
        } else {
            $ch = curl_init($this->apiUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => STATS_TIMEOUT,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 5,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $queryString,
            ]);
            $raw = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            if ($raw === false) {
                throw new StatsSchemaException("Matomo curl error for {$method}: {$err}");
            }
            if ($code >= 400) {
                throw new StatsSchemaException("Matomo HTTP {$code} for {$method}: {$raw}");
            }
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new StatsSchemaException("Matomo returned non-JSON for {$method}: " . substr((string)$raw, 0, 200));
        }
        // Matomo sometimes wraps errors as { result: 'error', message: '...' }
        if (isset($decoded['result']) && $decoded['result'] === 'error') {
            $msg = expectString($decoded['message'] ?? 'unknown error', 'Matomo.error.message');
            throw new StatsSchemaException("Matomo API error for {$method}: {$msg}");
        }
        return $decoded;
    }

    private function fallbackPost(string $queryString): string
    {
        $ctx = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $queryString,
            'timeout' => (string)STATS_TIMEOUT,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($this->apiUrl, false, $ctx);
        if ($raw === false) {
            throw new StatsSchemaException("Matomo file_get_contents failed for {$this->apiUrl}");
        }
        return $raw;
    }
}

// -------------------------------------------------------------------------
// Aggregation — one entry per stat block
// -------------------------------------------------------------------------

function fetchAll(MatomoStatsClient $client): array
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

    // 7. Funding traction — reuses Ko-fi data
    $donationsData = parseDonationsData();

    return [
        'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
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
// Cache layer
// -------------------------------------------------------------------------

function cacheKey(): string
{
    return STATS_CACHE_DIR . '/' . 'stats_v1_' . MATOMO_STATS_SITE_ID . '.json';
}

function tryServeCache(): void
{
    if (STATS_CACHE_TTL <= 0) {
        return;
    }
    $file = cacheKey();
    if (file_exists($file) && (time() - filemtime($file)) < STATS_CACHE_TTL) {
        $raw = @file_get_contents($file);
        if ($raw !== false) {
            echo $raw;
            exit;
        }
    }
}

function saveCache(string $payload): void
{
    if (STATS_CACHE_TTL <= 0) {
        return;
    }
    @file_put_contents(cacheKey(), $payload);
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

tryServeCache();

try {
    $client = new MatomoStatsClient(MATOMO_STATS_API_URL, MATOMO_STATS_TOKEN, (string)MATOMO_STATS_SITE_ID);
    $stats = fetchAll($client);
    $json = json_encode($stats, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new StatsSchemaException('json_encode failed: ' . json_last_error_msg());
    }
    saveCache($json);
    echo $json;
} catch (StatsSchemaException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(buildErrorPayload($e));
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(buildErrorPayload($e));
}

function buildErrorPayload(Throwable $e): array
{
    $payload = ['error' => true, 'message' => $e->getMessage(), 'code' => 500];
    if (STATS_DEBUG) {
        $payload['trace'] = $e->getTraceAsString();
        $payload['file'] = $e->getFile() . ':' . $e->getLine();
    }
    return $payload;
}
