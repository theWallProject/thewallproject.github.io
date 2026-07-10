<?php

/**
 * stats-common.php — shared library for the public stats endpoints.
 *
 * Holds every piece that is identical (≥90 %) between the marketing
 * and addon stats layers: constants, fail-fast bootstrap, CORS / cache
 * headers, primitive schema helpers, StatsSchemaException, the Matomo
 * HTTP client, the generic period / ranking / frequency / live / event /
 * donations parsers, the file cache layer, and the runEndpoint() driver.
 *
 * This file is NOT a standalone endpoint — it is required by either
 * stats.php (marketing, MATOMO_SITE_MARKETING) or addon-stats.php
 * (addon, MATOMO_SITE_ADDON). Each sister file declares its own
 * MATOMO_STATS_SITE_ID constant BEFORE requiring this file, and
 * supplies its fetchAll*() callback to runEndpoint().
 *
 * Contract: any schema mismatch throws StatsSchemaException →
 * runEndpoint() responds with HTTP 500 + an error envelope. The React
 * client re-validates the same shape with Zod `.strict()` so unknown
 * shapes fail hard on both ends. Adding a new stat = one entry per
 * side (PHP parser + Zod schema) — mirror of STATS.md.
 */

declare(strict_types=1);

// -------------------------------------------------------------------------
// Constants — site IDs are provided by the requiring file. The rest is
// generic across endpoints.
// -------------------------------------------------------------------------

if (!defined('STATS_DEBUG')) {
    define('STATS_DEBUG', true); // flip to false in production
}

define('STATS_CONFIG_FILE', __DIR__ . '/../../dynamic/config.php');
define('STATS_CACHE_DIR', sys_get_temp_dir() . '/stats_cache');

// Single master switch for ALL caching (server file cache + HTTP
// Cache-Control header + client refetch interval via X-Stats-Cache-Ttl
// response header). 0 = disabled (every request hits Matomo live;
// client never polls).
if (!defined('STATS_CACHE_TTL')) {
    define('STATS_CACHE_TTL', 0);
}

define('STATS_TIMEOUT', 12); // seconds per Matomo call
define('STATS_ALL_TIME_START', '2000-01-01'); // effectively "since the beginning"
define('STATS_ALL_TIME_END', 'today');
define('STATS_TOP_LIMIT', 10); // cut every ranking to N rows

// Optional: read donations data for funding traction card. Shared by
// both endpoints — represents org-wide funding, not site-specific.
define('STATS_DONATIONS_FILE', __DIR__ . '/../../dynamic/donations_data.json');

// -------------------------------------------------------------------------
// Fail-fast bootstrap — mirrors the donations.php pattern
// -------------------------------------------------------------------------

function statsBootstrap(): void
{
    if (!file_exists(STATS_CONFIG_FILE) || !is_readable(STATS_CONFIG_FILE)) {
        statsFatal(500, 'config.php missing or unreadable');
    }

    require_once STATS_CONFIG_FILE;

    foreach (['MATOMO_STATS_TOKEN', 'MATOMO_STATS_API_URL'] as $const) {
        if (!defined($const) || (string) constant($const) === '') {
            statsFatal(500, "Constant {$const} not configured in config.php");
        }
    }

    if (!is_dir(STATS_CACHE_DIR) && !@mkdir(STATS_CACHE_DIR, 0775, true) && !is_dir(STATS_CACHE_DIR)) {
        statsFatal(500, 'cache dir not writable: ' . STATS_CACHE_DIR);
    }
}

/**
 * Emit a JSON error envelope and stop. Pre-bootstrap fallback that does
 * not rely on class autoloading.
 */
function statsFatal(int $code, string $message): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => $message, 'code' => $code]);
    exit;
}

// -------------------------------------------------------------------------
// CORS + cache headers (data is public read-only)
// -------------------------------------------------------------------------

function statsEmitHeaders(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json; charset=utf-8');
    header('X-Stats-Cache-Ttl: ' . STATS_CACHE_TTL);

    if (STATS_CACHE_TTL > 0) {
        header('Cache-Control: public, max-age=' . STATS_CACHE_TTL);
    } else {
        header('Cache-Control: no-store, no-cache, must-revalidate');
    }
}

// -------------------------------------------------------------------------
// Primitive schema helpers — hand-rolled mirror of src/types/stats.ts
// Zod schemas. Each Matomo method is mapped to an expected shape; a
// mismatch throws StatsSchemaException.
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
 * @return float
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

// -------------------------------------------------------------------------
// Shared Matomo Reporting API parsers — used by both endpoints
// -------------------------------------------------------------------------

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
 * Parse Events.getAction with flat=1 — Matomo returns rows keyed by
 * event category + action. We filter by action name client-side via
 * $actionFilter.
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
 * Parse donations_data.json — reuses existing dynamic file. Missing
 * file is OK (returns neutral zeros, not a hard fail — funding card
 * degrades gracefully but other stats still render).
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
     * Call a Matomo Reporting API method via POST.
     *
     * Per Matomo docs: module/method/idSite/period/date go in the URL,
     * token_auth goes in the POST body only (POST-only tokens reject
     * auth if token_auth appears in the query string).
     *
     * @return mixed
     * @throws StatsSchemaException
     */
    public function get(string $method, array $extraParams = [])
    {
        $urlParams = array_merge([
            'module' => 'API',
            'method' => $method,
            'idSite' => $this->siteId,
            'format' => 'JSON',
            'format_metrics' => '0',
        ], $extraParams);

        $url = $this->apiUrl . '?' . http_build_query($urlParams);
        $postBody = http_build_query(['token_auth' => $this->token]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => STATS_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postBody,
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

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new StatsSchemaException("Matomo returned non-JSON for {$method} (HTTP {$code}): " . substr((string)$raw, 0, 2000));
        }
        if (isset($decoded['result']) && $decoded['result'] === 'error') {
            $msg = expectString($decoded['message'] ?? 'unknown error', 'Matomo.error.message');
            throw new StatsSchemaException("Matomo API error for {$method}: {$msg}");
        }
        return $decoded;
    }
}

// -------------------------------------------------------------------------
// Cache layer
// -------------------------------------------------------------------------

function cacheKey(int $siteId): string
{
    return STATS_CACHE_DIR . '/' . 'stats_v1_' . $siteId . '.json';
}

function tryServeCache(int $siteId): void
{
    if (STATS_CACHE_TTL <= 0) {
        return;
    }
    $file = cacheKey($siteId);
    if (file_exists($file) && (time() - filemtime($file)) < STATS_CACHE_TTL) {
        $raw = @file_get_contents($file);
        if ($raw !== false) {
            echo $raw;
            exit;
        }
    }
}

function saveCache(int $siteId, string $payload): void
{
    if (STATS_CACHE_TTL <= 0) {
        return;
    }
    @file_put_contents(cacheKey($siteId), $payload);
}

// -------------------------------------------------------------------------
// Error envelope
// -------------------------------------------------------------------------

function buildErrorPayload(Throwable $e): array
{
    $payload = ['error' => true, 'message' => $e->getMessage(), 'code' => 500];
    if (STATS_DEBUG) {
        $payload['trace'] = $e->getTraceAsString();
        $payload['file'] = $e->getFile() . ':' . $e->getLine();
    }
    return $payload;
}

// -------------------------------------------------------------------------
// runEndpoint — shared driver. Each endpoint file calls this exactly
// once with its site ID and a fetchAll callback that returns the
// validated response array.
// -------------------------------------------------------------------------

function runEndpoint(int $siteId, callable $fetchAll): void
{
    statsBootstrap();
    statsEmitHeaders();

    tryServeCache($siteId);

    try {
        $client = new MatomoStatsClient(MATOMO_STATS_API_URL, MATOMO_STATS_TOKEN, (string)$siteId);
        $stats = $fetchAll($client);
        $json = json_encode($stats, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json === false) {
            throw new StatsSchemaException('json_encode failed: ' . json_last_error_msg());
        }
        saveCache($siteId, $json);
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
}
