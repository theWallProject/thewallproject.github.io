<?php

/**
 * stats-common.php — shared library for the public stats endpoints.
 *
 * Holds every piece that is identical (≥90 %) between the marketing
 * and addon stats layers: constants, fail-fast bootstrap, CORS / cache
 * headers, Valinor DTOs for Matomo API response structures, the generic
 * period / ranking / frequency / live / event / donations parsers, the
 * Matomo HTTP client, the file cache layer, and the runEndpoint()
 * driver.
 *
 * This file is NOT a standalone endpoint — it is required by either
 * stats.php (marketing, MATOMO_SITE_MARKETING) or addon-stats.php
 * (addon, MATOMO_SITE_ADDON). Each sister file declares its own
 * MATOMO_STATS_SITE_ID constant BEFORE requiring this file, and
 * supplies its fetchAll*() callback to runEndpoint().
 *
 * Schema validation is handled by cuyz/valinor (the closest PHP
 * equivalent to Zod). Each Matomo response block is mapped to a typed
 * DTO — a shape mismatch throws \CuyZ\Valinor\Mapper\MappingError,
 * which runEndpoint() catches and returns as a JSON error envelope.
 * The React client re-validates the same shape with Zod `.strict()` so
 * unknown shapes fail hard on both ends.
 *
 * Adding a new stat = one DTO + one parse function (PHP) + one field in
 * the Zod schema (TS) — mirror of STATS.md.
 */

declare(strict_types=1);

use CuyZ\Valinor\Mapper\TreeMapper;
use CuyZ\Valinor\MapperBuilder;

// -------------------------------------------------------------------------
// Constants — site IDs are provided by the requiring file. The rest is
// generic across endpoints.
// -------------------------------------------------------------------------

if (!defined('STATS_DEBUG')) {
    define('STATS_DEBUG', false); // flip to false in production
}

define('STATS_CONFIG_FILE', __DIR__ . '/../../dynamic/config.php');
define('STATS_CACHE_DIR', sys_get_temp_dir() . '/stats_cache');

// Single master switch for ALL caching (server file cache + HTTP
// Cache-Control header + client refetch interval via X-Stats-Cache-Ttl
// response header). 0 = disabled (every request hits Matomo live;
// client never polls).
if (!defined('STATS_CACHE_TTL')) {
    define('STATS_CACHE_TTL', 3600);
}

define('STATS_TIMEOUT', 30); // seconds per Matomo call
define('STATS_ALL_TIME_START', '2000-01-01'); // effectively "since the beginning"
define('STATS_ALL_TIME_END', 'today');
define('STATS_TOP_LIMIT', 5); // cut every ranking to N rows

// Public base path for Matomo assets (flags, browser logos, etc.).
// Matomo returns relative paths like "plugins/Morpheus/icons/dist/flags/eg.png"
// — these need the Matomo installation prefix to resolve in the browser.
// Override in config.php if Matomo is at a different public path.
if (!defined('STATS_MATOMO_ASSETS_URL')) {
    define('STATS_MATOMO_ASSETS_URL', '/matomo/');
}

// Optional: read donations data for funding traction card. Shared by
// both endpoints — represents org-wide funding, not site-specific.
define('STATS_DONATIONS_FILE', __DIR__ . '/../../dynamic/donations_data.json');

// Debug dump directory — when STATS_DEBUG is on, every raw Matomo API
// response is written here as <siteId>_<method>.json for inspection.
define('STATS_DEBUG_DIR', sys_get_temp_dir() . '/stats_debug');

// -------------------------------------------------------------------------
// Fail-fast bootstrap — loads config, autoloader, checks cache dir
// -------------------------------------------------------------------------

function statsBootstrap(): void
{
    $autoload = __DIR__ . '/../../vendor/autoload.php';
    if (!file_exists($autoload)) {
        statsFatal(500, 'vendor/autoload.php missing — run composer install');
    }
    require_once $autoload;

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

    if (STATS_DEBUG && !is_dir(STATS_DEBUG_DIR) && !@mkdir(STATS_DEBUG_DIR, 0775, true) && !is_dir(STATS_DEBUG_DIR)) {
        statsFatal(500, 'debug dir not writable: ' . STATS_DEBUG_DIR);
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
// Valinor mapper singleton — typed DTO maps replace hand-rolled
// expectInt/String/Float/Array/Object helpers.
// -------------------------------------------------------------------------

function getMapper(): TreeMapper
{
    static $mapper = null;
    if ($mapper === null) {
        $mapper = (new MapperBuilder())
            // allowSuperfluousKeys = true means Matomo can add
            // undocumented fields without breaking PHP. The client-side
            // Zod .strict() still rejects those fields as drift.
            ->allowSuperfluousKeys(true)
            ->enableFlexibleCasting()
            ->mapper();
    }
    return $mapper;
}

/**
 * Shared exception for non-shape errors (curl failures, HTTP statuses,
 * json_encode problems). Shape errors use Valinor's MappingError — no
 * more expect* functions.
 */
class StatsSchemaException extends Exception
{
}

// -------------------------------------------------------------------------
// DTOs — each maps one Matomo API response shape. Defaults allow
// graceful fallback when Matomo omits a field.
// -------------------------------------------------------------------------

final class PeriodSummaryDto
{
    public function __construct(
        public readonly int $nb_visits = 0,
        public readonly int $nb_uniq_visitors = 0,
        public readonly int $nb_actions = 0,
        public readonly float $bounce_rate = 0.0,
        public readonly int $avg_time_on_site = 0,
    ) {
    }
}

final class RankingRowDto
{
    public function __construct(
        public readonly string $label = '',
        public readonly int $nb_visits = 0,
        public readonly ?string $logo = null,
    ) {
    }
}

final class FrequencyDto
{
    public function __construct(
        public readonly int $nb_visits_new = 0,
        public readonly int $nb_visits_returning = 0,
    ) {
    }
}

final class LiveCounterDto
{
    public function __construct(
        public readonly int $visits = 0,
        public readonly int $actions = 0,
    ) {
    }
}

final class EventActionDto
{
    public function __construct(
        public readonly string $label = '',
        public readonly string $secondaryLabel = '',
        public readonly int $nb_events = 0,
    ) {
    }
}

final class DonationDto
{
    public function __construct(
        public readonly float $amount = 0.0,
        public readonly string $currency = 'USD',
        public readonly string $timestamp = '',
        public readonly string $type = 'Donation',
    ) {
    }
}

/**
 * Matomo Events.getName flat=1 row. The critical field is
 * Events_EventName (clean event name like "allow_month"), NOT `label`
 * which is the display string "allow_month - Click". Declaring this
 * field as required forces Valinor to fail if Matomo renames it.
 */
final class EventNameRowDto
{
    public function __construct(
        public readonly string $Events_EventName = '',
        public readonly int $nb_events = 0,
    ) {
    }
}

/**
 * Matomo Actions.getPageTitles flat=1 row. nb_hits is the total times
 * the page title was displayed (used as the blocks proxy for "wall").
 */
final class PageTitleRowDto
{
    public function __construct(
        public readonly string $label = '',
        public readonly int $nb_hits = 0,
    ) {
    }
}

// -------------------------------------------------------------------------
// Shared Matomo Reporting API parsers — each marshals a raw API response
// through Valinor into the canonical camelCase response shape.
// -------------------------------------------------------------------------

/**
 * Parse a single-period VisitsSummary.get response (Matomo returns a
 * metric object: { nb_visits, nb_uniq_visitors, nb_actions, ... }).
 */
function parsePeriodSummary($raw, string $periodLabel): array
{
    try {
        /** @var PeriodSummaryDto $dto */
        $dto = getMapper()->map(PeriodSummaryDto::class, $raw);
    } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
        throw new StatsSchemaException("VisitsSummary.{$periodLabel} validation failed: " . $e->getMessage(), 0, $e);
    }
    return [
        'visits' => $dto->nb_visits,
        'uniqueVisitors' => $dto->nb_uniq_visitors,
        'actions' => $dto->nb_actions,
        'bounceRate' => $dto->bounce_rate,
        'avgVisitDuration' => $dto->avg_time_on_site,
    ];
}

/**
 * Parse a ranking response (Matomo returns list of { label, nb_visits,
 * logo?, ... }). Limits to $limit rows. Unknown map keys are silently
 * ignored by Valinor (allowSuperfluousKeys = true).
 */
function parseRankingRows($raw, string $method, int $limit): array
{
    if (!is_array($raw)) {
        throw new StatsSchemaException("{$method}: expected array, got " . gettype($raw));
    }
    $out = [];
    $mapper = getMapper();
    foreach (array_slice($raw, 0, $limit) as $i => $row) {
        if (!is_array($row)) {
            continue;
        }
        try {
            /** @var RankingRowDto $dto */
            $dto = $mapper->map(RankingRowDto::class, $row);
        } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
            throw new StatsSchemaException("{$method}[{$i}] validation failed: " . $e->getMessage(), 0, $e);
        }
        $parsed = [
            'label' => $dto->label,
            'visits' => $dto->nb_visits,
        ];
        if ($dto->logo !== null && $dto->logo !== '') {
            // Matomo returns relative paths like
            // "plugins/Morpheus/icons/dist/flags/eg.png" — prepend the
            // public Matomo base URL so the browser can load them.
            $logo = $dto->logo;
            if (!str_starts_with($logo, 'http')) {
                $logo = rtrim(STATS_MATOMO_ASSETS_URL, '/') . '/' . $logo;
            }
            $parsed['logo'] = $logo;
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
    try {
        /** @var FrequencyDto $dto */
        $dto = getMapper()->map(FrequencyDto::class, $raw);
    } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
        throw new StatsSchemaException('VisitFrequency.get validation failed: ' . $e->getMessage(), 0, $e);
    }
    return [
        'newVisits' => $dto->nb_visits_new,
        'returningVisits' => $dto->nb_visits_returning,
    ];
}

/**
 * Parse Live.getCounters — returns list of one counter object.
 */
function parseLiveCounters($raw): array
{
    if (!is_array($raw) || count($raw) === 0) {
        return ['visits' => 0, 'actions' => 0];
    }
    try {
        /** @var LiveCounterDto $dto */
        $dto = getMapper()->map(LiveCounterDto::class, $raw[0]);
    } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
        throw new StatsSchemaException('Live.getCounters validation failed: ' . $e->getMessage(), 0, $e);
    }
    return [
        'visits' => $dto->visits,
        'actions' => $dto->actions,
    ];
}

/**
 * Parse Events.getAction with flat=1 — Matomo returns rows keyed by
 * event category + action. We filter by action name.
 */
function parseEventActions($raw, string $actionFilter): array
{
    if (!is_array($raw)) {
        throw new StatsSchemaException('Events.getAction: expected array, got ' . gettype($raw));
    }
    $out = [];
    $mapper = getMapper();
    foreach ($raw as $i => $row) {
        if (!is_array($row)) {
            continue;
        }
        try {
            /** @var EventActionDto $dto */
            $dto = $mapper->map(EventActionDto::class, $row);
        } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
            throw new StatsSchemaException("Events.getAction[{$i}] validation failed: " . $e->getMessage(), 0, $e);
        }
        if ($dto->label !== $actionFilter) {
            continue;
        }
        $out[] = [
            'label' => $dto->secondaryLabel !== '' ? $dto->secondaryLabel : $dto->label,
            'events' => $dto->nb_events,
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
        $mapper = getMapper();
        foreach ($raw['donations'] as $i => $d) {
            if (!is_array($d)) {
                continue;
            }
            try {
                /** @var DonationDto $dto */
                $dto = $mapper->map(DonationDto::class, $d);
            } catch (\CuyZ\Valinor\Mapper\MappingError) {
                continue;
            }
            $donations[] = [
                'amount' => $dto->amount,
                'currency' => $dto->currency,
                'timestamp' => $dto->timestamp,
                'type' => $dto->type,
            ];
        }
    }
    return ['currentMonthly' => $currentMonthly, 'donations' => $donations];
}

/**
 * Parse Actions.getPageTitles flat=1 → total hits for a given page
 * title. Used by the addon endpoint to read the "wall" banner-display
 * count as a blocks proxy. Returns 0 if the title row is absent.
 *
 * Each row is validated against PageTitleRowDto via Valinor — if
 * Matomo changes the `label` or `nb_hits` field names, this throws
 * instead of silently returning 0.
 */
function parsePageTitleHits($raw, string $titleFilter): int
{
    if (!is_array($raw)) {
        throw new StatsSchemaException('Actions.getPageTitles: expected array, got ' . gettype($raw));
    }
    $mapper = getMapper();
    foreach ($raw as $i => $row) {
        if (!is_array($row)) {
            continue;
        }
        try {
            /** @var PageTitleRowDto $dto */
            $dto = $mapper->map(PageTitleRowDto::class, $row);
        } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
            throw new StatsSchemaException("Actions.getPageTitles[{$i}] validation failed: " . $e->getMessage(), 0, $e);
        }
        if ($dto->label !== $titleFilter) {
            continue;
        }
        return $dto->nb_hits;
    }
    return 0;
}

/**
 * Parse Events.getName flat=1 → list of {name, events} pairs. Each row
 * is validated against EventNameRowDto via Valinor. The critical field
 * is Events_EventName (clean name like "allow_month"), NOT `label`
 * (display string "allow_month - Click"). The DTO enforces this — if
 * Matomo renames Events_EventName, Valinor throws.
 *
 * The addon endpoint uses this to sum events per group.
 */
function parseEventNameRows($raw): array
{
    if (!is_array($raw)) {
        throw new StatsSchemaException('Events.getName: expected array, got ' . gettype($raw));
    }
    $mapper = getMapper();
    $out = [];
    foreach ($raw as $i => $row) {
        if (!is_array($row)) {
            continue;
        }
        try {
            /** @var EventNameRowDto $dto */
            $dto = $mapper->map(EventNameRowDto::class, $row);
        } catch (\CuyZ\Valinor\Mapper\MappingError $e) {
            throw new StatsSchemaException("Events.getName[{$i}] validation failed: " . $e->getMessage(), 0, $e);
        }
        $out[] = [
            'name' => $dto->Events_EventName,
            'events' => $dto->nb_events,
        ];
    }
    return $out;
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
     * @throws StatsSchemaException
     */
    public function get(string $method, array $extraParams = []): mixed
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
            CURLOPT_CONNECTTIMEOUT => 15,
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
            $msg = is_string($decoded['message'] ?? null) ? $decoded['message'] : 'unknown error';
            throw new StatsSchemaException("Matomo API error for {$method}: {$msg}");
        }

        if (STATS_DEBUG) {
            $dumpFile = STATS_DEBUG_DIR . '/' . $this->siteId . '_' . str_replace('.', '_', $method) . '.json';
            @file_put_contents($dumpFile, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
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
    if (STATS_DEBUG || STATS_CACHE_TTL <= 0) {
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
