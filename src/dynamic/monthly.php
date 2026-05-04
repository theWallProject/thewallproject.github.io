<?php
define('KOFI_DEBUG', true);

define('KOFI_DATA_FILE', __DIR__ . '/donations_data.json');
define('KOFI_LOG_FILE', __DIR__ . '/donations_debug.log');
define('KOFI_LOG_MAX_BYTES', 5 * 1024 * 1024);
define('KOFI_MAX_AMOUNT', 10000);
define('KOFI_MAX_MESSAGE_ID_LEN', 255);
define('KOFI_ALLOWED_TYPES', ['Donation', 'Subscription', 'Commission', 'Shop Order']);
define('KOFI_CACHE_DIR', sys_get_temp_dir() . '/donations_cache');
define('KOFI_MAX_BODY_LEN', 65536);
define('KOFI_MAX_DONATIONS', 1000);
define('KOFI_FROM_MAX_LEN', 255);
define('KOFI_MESSAGE_MAX_LEN', 1000);
define('KOFI_TIER_NAME_MAX_LEN', 100);
define('KOFI_CURRENCY_MAX_LEN', 10);
define('KOFI_SHOP_ITEMS_MAX', 50);

if (!file_exists(__DIR__ . '/config.php')) {
    http_response_code(500);
    exit('config.php missing - cannot start');
}
require_once __DIR__ . '/config.php';

if (!defined('KOFI_VERIFICATION_TOKEN')) {
    http_response_code(500);
    exit('KOFI_VERIFICATION_TOKEN not defined in config.php');
}
if (KOFI_VERIFICATION_TOKEN === '') {
    http_response_code(500);
    exit('KOFI_VERIFICATION_TOKEN is empty in config.php');
}

function kofi_log(string $msg): void {
    if (!KOFI_DEBUG) {
        return;
    }
    $logFile = KOFI_LOG_FILE;
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        if (!mkdir($logDir, 0755, true)) {
            return;
        }
    }
    if (file_exists($logFile) && filesize($logFile) > KOFI_LOG_MAX_BYTES) {
        rename($logFile, $logFile . '.1');
    }
    $ts = date('Y-m-d H:i:s');
    $entry = "[$ts] $msg\n";
    $result = file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    if ($result === false) {
        error_log("kofi_log: failed to write to {$logFile}");
    }
}

function kofi_send(int $code, string $body = ''): void {
    kofi_log("RESPONSE {$code} {$body}");
    http_response_code($code);
    if ($body !== '') {
        header('Content-Type: text/plain; charset=utf-8');
        echo $body;
    }
    exit;
}

function kofi_atomic_write(string $path, string $content): void {
    $pid = getmypid();
    if ($pid === false) {
        kofi_log("ATOMIC_WRITE ABORT: getmypid() failed");
        kofi_send(500, 'Internal server error');
    }
    $tmpPath = $path . '.tmp.' . $pid;
    kofi_log("ATOMIC_WRITE tmp={$tmpPath}");
    $written = file_put_contents($tmpPath, $content, LOCK_EX);
    if ($written === false) {
        kofi_log("ATOMIC_WRITE ABORT: could not write tmp file");
        @unlink($tmpPath);
        kofi_send(500, 'Write failed: tmp');
    }
    kofi_log("ATOMIC_WRITE wrote {$written} bytes to tmp");
    if (!rename($tmpPath, $path)) {
        kofi_log("ATOMIC_WRITE ABORT: could not rename tmp to final");
        @unlink($tmpPath);
        kofi_send(500, 'Write failed: rename');
    }
    kofi_log("ATOMIC_WRITE success: {$path}");
}

function kofi_purge_cache(): void {
    $cacheDir = KOFI_CACHE_DIR;
    if (!is_dir($cacheDir)) {
        kofi_log("CACHE_PURGE no dir: {$cacheDir} - nothing to purge");
        return;
    }
    $files = glob($cacheDir . '/donations_*.png');
    if ($files === false) {
        kofi_log("CACHE_PURGE glob failed on {$cacheDir}");
        return;
    }
    if (count($files) === 0) {
        kofi_log("CACHE_PURGE no cache files found");
        return;
    }
    $count = 0;
    $failCount = 0;
    foreach ($files as $f) {
        if (unlink($f)) {
            $count++;
        } else {
            $failCount++;
            kofi_log("CACHE_PURGE failed to unlink: {$f}");
        }
    }
    kofi_log("CACHE_PURGE deleted={$count} failed={$failCount} from {$cacheDir}");
}

function kofi_sanitize_message_id(string $id): string {
    $clean = preg_replace('/[^a-zA-Z0-9\-_]/', '', $id);
    if ($clean === null) {
        return '';
    }
    return $clean;
}

kofi_log('=== REQUEST START ===');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
kofi_log("METHOD={$method} IP={$ip}");

if ($method !== 'POST') {
    kofi_log("REJECTED: method not POST");
    kofi_send(405, 'Method Not Allowed');
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false) {
    kofi_log("REJECTED: php://input read failed");
    kofi_send(400, 'Failed to read request body');
}
kofi_log("RAW_BODY length=" . strlen($rawBody));

if ($rawBody === '') {
    kofi_log("REJECTED: empty body");
    kofi_send(400, 'Empty body');
}

if (strlen($rawBody) > KOFI_MAX_BODY_LEN) {
    kofi_log("REJECTED: body too large (" . strlen($rawBody) . " bytes)");
    kofi_send(413, 'Payload too large');
}

parse_str($rawBody, $postFields);
if ($postFields === null || !is_array($postFields)) {
    kofi_log("REJECTED: parse_str failed");
    kofi_send(400, 'Failed to parse request body');
}

$dataRaw = $postFields['data'] ?? '';
if (!is_string($dataRaw) || $dataRaw === '') {
    kofi_log("REJECTED: missing or empty 'data' field");
    kofi_send(400, 'Missing data field');
}

kofi_log("DATA_RAW length=" . strlen($dataRaw));

$payload = json_decode($dataRaw, true);
if ($payload === null || !is_array($payload)) {
    kofi_log("REJECTED: JSON decode failed - " . json_last_error_msg());
    kofi_send(400, 'Invalid JSON in data field');
}

kofi_log("PAYLOAD keys=" . implode(',', array_keys($payload)));

$messageId = $payload['message_id'] ?? '';
if (!is_string($messageId) || $messageId === '') {
    kofi_log("REJECTED: missing or invalid message_id");
    kofi_send(400, 'Missing message_id');
}
if (strlen($messageId) > KOFI_MAX_MESSAGE_ID_LEN) {
    kofi_log("REJECTED: message_id too long (" . strlen($messageId) . ")");
    kofi_send(400, 'message_id too long');
}
$messageId = kofi_sanitize_message_id($messageId);
if ($messageId === '') {
    kofi_log("REJECTED: message_id empty after sanitization");
    kofi_send(400, 'Invalid message_id');
}
kofi_log("MESSAGE_ID={$messageId}");

$timestamp = $payload['timestamp'] ?? '';
if (!is_string($timestamp) || $timestamp === '') {
    kofi_log("REJECTED: missing or invalid timestamp");
    kofi_send(400, 'Missing timestamp');
}
$tsParsed = strtotime($timestamp);
if ($tsParsed === false || $tsParsed < 0) {
    kofi_log("REJECTED: invalid timestamp format: {$timestamp}");
    kofi_send(400, 'Invalid timestamp');
}
kofi_log("TIMESTAMP={$timestamp}");

$type = $payload['type'] ?? '';
if (!is_string($type) || !in_array($type, KOFI_ALLOWED_TYPES, true)) {
    kofi_log("REJECTED: invalid type: " . var_export($type, true));
    kofi_send(400, 'Invalid type');
}
kofi_log("TYPE={$type}");

$amount = $payload['amount'] ?? null;
if (!is_numeric($amount)) {
    kofi_log("REJECTED: missing or non-numeric amount: " . var_export($amount, true));
    kofi_send(400, 'Invalid amount');
}
$amount = (float)$amount;
if ($amount < 0 || $amount > KOFI_MAX_AMOUNT) {
    kofi_log("REJECTED: amount out of range: {$amount}");
    kofi_send(400, 'Amount out of range');
}
kofi_log("AMOUNT={$amount}");

$isPublic = $payload['is_public'] ?? null;
if ($isPublic !== null && !is_bool($isPublic)) {
    kofi_log("REJECTED: is_public not boolean: " . var_export($isPublic, true));
    kofi_send(400, 'Invalid is_public');
}
kofi_log("IS_PUBLIC=" . var_export($isPublic, true));

$isSubscriptionPayment = array_key_exists('is_subscription_payment', $payload) ? $payload['is_subscription_payment'] : null;
if ($isSubscriptionPayment !== null && !is_bool($isSubscriptionPayment)) {
    kofi_log("REJECTED: is_subscription_payment not boolean");
    kofi_send(400, 'Invalid is_subscription_payment');
}
kofi_log("IS_SUBSCRIPTION_PAYMENT=" . var_export($isSubscriptionPayment, true));

$isFirstSubscriptionPayment = array_key_exists('is_first_subscription_payment', $payload) ? $payload['is_first_subscription_payment'] : null;
if ($isFirstSubscriptionPayment !== null && !is_bool($isFirstSubscriptionPayment)) {
    kofi_log("REJECTED: is_first_subscription_payment not boolean");
    kofi_send(400, 'Invalid is_first_subscription_payment');
}
kofi_log("IS_FIRST_SUBSCRIPTION_PAYMENT=" . var_export($isFirstSubscriptionPayment, true));

$token = $payload['verification_token'] ?? '';
if (!is_string($token) || $token === '') {
    kofi_log("REJECTED: missing verification_token");
    kofi_send(400, 'Missing verification_token');
}

$tokenValid = hash_equals(KOFI_VERIFICATION_TOKEN, $token);
kofi_log("TOKEN_VALID=" . ($tokenValid ? 'yes' : 'no'));
if (!$tokenValid) {
    kofi_send(403, 'Forbidden');
}

$dataFile = KOFI_DATA_FILE;
if (!file_exists($dataFile)) {
    kofi_log("FATAL: data file missing: {$dataFile}");
    kofi_send(500, 'Data file missing');
}
if (!is_readable($dataFile)) {
    kofi_log("FATAL: data file not readable: {$dataFile}");
    kofi_send(500, 'Data file not readable');
}
if (!is_writable($dataFile)) {
    kofi_log("FATAL: data file not writable: {$dataFile}");
    kofi_send(500, 'Data file not writable');
}

$fileContents = file_get_contents($dataFile);
if ($fileContents === false) {
    kofi_log("FATAL: file_get_contents failed on {$dataFile}");
    kofi_send(500, 'Could not read data file');
}

$store = json_decode($fileContents, true);
if ($store === null || !is_array($store)) {
    kofi_log("FATAL: data file JSON invalid - " . json_last_error_msg());
    kofi_send(500, 'Data file corrupt');
}

if (!array_key_exists('currentMonthly', $store)) {
    kofi_log("FATAL: data file missing currentMonthly key");
    kofi_send(500, 'Data file missing currentMonthly');
}
if (!is_numeric($store['currentMonthly'])) {
    kofi_log("FATAL: data file currentMonthly is not numeric: " . var_export($store['currentMonthly'], true));
    kofi_send(500, 'Data file currentMonthly invalid');
}
if (!array_key_exists('donations', $store)) {
    kofi_log("FATAL: data file missing donations key");
    kofi_send(500, 'Data file missing donations');
}
if (!is_array($store['donations'])) {
    kofi_log("FATAL: data file donations is not an array");
    kofi_send(500, 'Data file donations invalid');
}

kofi_log("DATA_FILE currentMonthly=" . $store['currentMonthly'] . " donations_count=" . count($store['donations']));

foreach ($store['donations'] as $i => $existing) {
    if (!is_array($existing)) {
        kofi_log("WARN: donation entry at index={$i} is not an array, skipping");
        continue;
    }
    if (isset($existing['message_id']) && $existing['message_id'] === $messageId) {
        kofi_log("DUPLICATE message_id={$messageId} at index={$i} - returning 200");
        kofi_send(200, 'Already processed');
    }
}

$sanitized = [
    'message_id' => $messageId,
    'timestamp' => $timestamp,
    'type' => $type,
    'amount' => $amount,
];

if ($isPublic !== null) {
    $sanitized['is_public'] = $isPublic;
}
if ($isSubscriptionPayment !== null) {
    $sanitized['is_subscription_payment'] = $isSubscriptionPayment;
}
if ($isFirstSubscriptionPayment !== null) {
    $sanitized['is_first_subscription_payment'] = $isFirstSubscriptionPayment;
}

$from = $payload['from'] ?? '';
if (is_string($from) && $from !== '') {
    $sanitized['from'] = mb_substr($from, 0, KOFI_FROM_MAX_LEN);
}

$message = $payload['message'] ?? '';
if (is_string($message)) {
    $sanitized['message'] = mb_substr($message, 0, KOFI_MESSAGE_MAX_LEN);
}

$tierName = $payload['tier_name'] ?? '';
if (is_string($tierName) && $tierName !== '') {
    $sanitized['tier_name'] = mb_substr($tierName, 0, KOFI_TIER_NAME_MAX_LEN);
}

$currency = $payload['currency'] ?? '';
if (is_string($currency) && $currency !== '') {
    $sanitized['currency'] = mb_substr($currency, 0, KOFI_CURRENCY_MAX_LEN);
}

$shopItems = $payload['shop_items'] ?? null;
if ($shopItems !== null && is_array($shopItems)) {
    $sanitized['shop_items'] = array_slice($shopItems, 0, KOFI_SHOP_ITEMS_MAX);
}

$isFirstMonthly = ($isFirstSubscriptionPayment === true && $type === 'Subscription');

if ($isFirstMonthly) {
    $store['currentMonthly'] = (float)$store['currentMonthly'] + $amount;
    kofi_log("FIRST_SUBSCRIPTION amount={$amount} new_total=" . $store['currentMonthly']);
} else {
    kofi_log("NOT_FIRST_SUBSCRIPTION type={$type} is_first=" . var_export($isFirstSubscriptionPayment, true) . " - amount NOT added");
}

$store['donations'][] = $sanitized;
$store['lastUpdated'] = gmdate('Y-m-d\TH:i:s\Z');

if (count($store['donations']) > KOFI_MAX_DONATIONS) {
    $store['donations'] = array_slice($store['donations'], -KOFI_MAX_DONATIONS);
    kofi_log("DONATIONS_TRIMMED to " . KOFI_MAX_DONATIONS);
}

$jsonOut = json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
if ($jsonOut === false) {
    kofi_log("FATAL: json_encode returned false");
    kofi_send(500, 'JSON encode failed');
}

kofi_log("WRITING data file (" . strlen($jsonOut) . " bytes)");
kofi_atomic_write($dataFile, $jsonOut);

if ($isFirstMonthly) {
    kofi_log("PURGING_CACHE due to first subscription");
    kofi_purge_cache();
}

kofi_log("SUCCESS message_id={$messageId}");
kofi_send(200, 'OK');