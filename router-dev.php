<?php
// Local router so /dynamic/donations.png maps to the donations generator,
// mirroring the production .htaccess rule. Dev-only (not committed).
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/dynamic/donations.png' || $path === '/dynamic/donations.php') {
    require __DIR__ . '/src/dynamic/donations.php';
    return true;
}

return false;
