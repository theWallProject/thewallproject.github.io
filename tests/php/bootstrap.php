<?php

/**
 * Test bootstrap — loads the shared stats library + addon endpoint so
 * all parse functions and DTOs are available for unit tests. Constants
 * that would normally come from config.php or the endpoint wrapper are
 * defined here to avoid side effects (no curl, no config file I/O).
 */

declare(strict_types=1);

$autoload = __DIR__ . '/../../vendor/autoload.php';
if (!file_exists($autoload)) {
    fwrite(STDERR, "vendor/autoload.php missing — run composer install\n");
    exit(1);
}
require_once $autoload;

// Constants normally defined by the endpoint wrapper (stats.php /
// addon-stats.php) before requiring stats-common.php.
if (!defined('MATOMO_SITE_MARKETING')) {
    define('MATOMO_SITE_MARKETING', 2);
}
if (!defined('MATOMO_SITE_ADDON')) {
    define('MATOMO_SITE_ADDON', 1);
}
if (!defined('MATOMO_STATS_SITE_ID')) {
    define('MATOMO_STATS_SITE_ID', MATOMO_SITE_ADDON);
}

// Dummy config constants (not used by parse functions but referenced
// in stats-common.php as class constants — Valinor needs them defined
// even though they won't be called during tests).
if (!defined('MATOMO_STATS_TOKEN')) {
    define('MATOMO_STATS_TOKEN', 'test-token');
}
if (!defined('MATOMO_STATS_API_URL')) {
    define('MATOMO_STATS_API_URL', 'http://127.0.0.1/matomo/index.php');
}

require_once __DIR__ . '/../../src/dynamic/stats-common.php';
require_once __DIR__ . '/../../src/dynamic/addon-stats.php';

/**
 * Load a frozen test fixture from tests/fixtures/ (static snapshots, not
 * the live debug dumps in docs/stats-debug/ which get overwritten on
 * every stats page fetch).
 */
function loadFixture(string $filename): mixed
{
    $path = __DIR__ . '/../../tests/fixtures/' . $filename;
    if (!file_exists($path)) {
        throw new RuntimeException("Fixture not found: {$path}");
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        throw new RuntimeException("Cannot read fixture: {$path}");
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException("JSON parse error in {$path}: " . json_last_error_msg());
    }
    return $decoded;
}