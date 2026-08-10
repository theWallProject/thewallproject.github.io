<?php

declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 1);

define('DYNAMIC_DIR', __DIR__ . '/../../dynamic');
define('DATA_FILE', DYNAMIC_DIR . '/donations_data.json');

// --- Fail-fast: dynamic directory and data file must exist and be readable ---

if (!is_dir(DYNAMIC_DIR)) {
    http_response_code(500);
    exit('FATAL: Dynamic data directory missing: ' . DYNAMIC_DIR . ' — create it outside the web root with proper ownership');
}

if (!file_exists(DATA_FILE)) {
    http_response_code(500);
    exit('FATAL: Donations data file missing: ' . DATA_FILE . ' — create it with schema: {"currentMonthly":0,"lastUpdated":"","donations":[]}');
}

if (!is_readable(DATA_FILE)) {
    http_response_code(500);
    exit('FATAL: Donations data file not readable: ' . DATA_FILE . ' — check file permissions');
}

// --- Load and validate data ---

$jsonData = file_get_contents(DATA_FILE);
if ($jsonData === false) {
    http_response_code(500);
    exit('FATAL: Failed to read donations data file: ' . DATA_FILE);
}

$decoded = json_decode($jsonData, true);
if ($decoded === null || !is_array($decoded)) {
    http_response_code(500);
    exit('FATAL: donations_data.json contains invalid JSON: ' . DATA_FILE . ' — ' . json_last_error_msg());
}

if (!array_key_exists('currentMonthly', $decoded)) {
    http_response_code(500);
    exit('FATAL: donations_data.json missing currentMonthly key: ' . DATA_FILE);
}

if (!is_numeric($decoded['currentMonthly'])) {
    http_response_code(500);
    exit('FATAL: donations_data.json currentMonthly is not numeric: ' . DATA_FILE);
}

$currentMonthly = max(0, (float)$decoded['currentMonthly']);
$goalAmount = 800;
$maxRowBricks = max(3, min(100, intval($_GET['maxRowBricks'] ?? 30)));
$maxBrickDimension = 120;

$currentBricks = intdiv((int)$currentMonthly, 10);
$goalBricks = intdiv($goalAmount, 10);
if ($goalBricks <= $currentBricks) {
    $goalBricks = $currentBricks + 1;
}
$totalPositions = $goalBricks + 1;

// --- Cache ---
// Under the PHP built-in dev server (`php -S`) we always regenerate so the
// latest edits are visible immediately; production keeps the 1h file cache.
$isDevServer = php_sapi_name() === 'cli-server';

$cacheKey = md5(serialize([$currentMonthly, $goalAmount, $maxRowBricks, 'v8']));
$cacheDir = sys_get_temp_dir() . '/donations_cache';
$cacheFile = $cacheDir . '/donations_' . $cacheKey . '.png';
$cacheTtl = 3600;

if (!is_dir($cacheDir)) {
    if (!mkdir($cacheDir, 0755, true)) {
        http_response_code(500);
        exit('Failed to create cache directory');
    }
}

if (!$isDevServer && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: image/png');
    header('Cache-Control: public, max-age=3600');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($cacheFile)) . ' GMT');
    readfile($cacheFile);
    exit;
}

// --- Image generation prerequisites ---

// In the local dev server the repo layout differs from production (where this
// script runs from dist/dynamic and reads ../files). Point straight at the
// public dir when running under `php -S`.
$assetDir = $isDevServer ? __DIR__ . '/../../public/files' : __DIR__ . '/../files';
$brickPath = $assetDir . '/common/brick.png';
// Prefer the website font — bold for the CTA — and fall back to the variable
// Roboto if the statics aren't deployed yet.
$fontPath = $assetDir . '/common/Outfit-Bold.ttf';
if (!file_exists($fontPath)) {
    $fontPath = $assetDir . '/common/Outfit-Variable.ttf';
}
if (!file_exists($fontPath)) {
    $fontPath = $assetDir . '/common/Roboto-Variable.ttf';
}

if (!function_exists('imagecreatefrompng')) {
    http_response_code(500);
    exit('GD library not available');
}

if (!function_exists('imagettftext')) {
    http_response_code(500);
    exit('GD FreeType not available');
}

if (!function_exists('imagerotate')) {
    http_response_code(500);
    exit('GD imagerotate not available');
}

if (!file_exists($brickPath) || !is_readable($brickPath)) {
    http_response_code(500);
    exit('Brick image not found: ' . $brickPath);
}

if (!file_exists($fontPath) || !is_readable($fontPath)) {
    http_response_code(500);
    exit('Font file not found: ' . $fontPath);
}

$srcImage = imagecreatefrompng($brickPath);
if ($srcImage === false) {
    http_response_code(500);
    exit('Failed to load brick image');
}

$origW = imagesx($srcImage);
$origH = imagesy($srcImage);

if ($origW <= 0 || $origH <= 0) {
    http_response_code(500);
    exit('Invalid brick image dimensions');
}

$scale = $maxBrickDimension / max($origW, $origH);
$brickW = (int)round($origW * $scale);
$brickH = (int)round($origH * $scale);

if ($brickW <= 0 || $brickH <= 0) {
    http_response_code(500);
    exit('Brick dimensions too small after scaling');
}

$rows = 0;
$_remaining = $totalPositions;
while ($_remaining > 0) {
    $_capacity = ($rows % 2 === 0) ? ($maxRowBricks + 1) : $maxRowBricks;
    $_remaining -= $_capacity;
    $rows++;
}
$halfW = (int)($brickW / 2);

if ($halfW <= 0) {
    http_response_code(500);
    exit('Brick too small for half-width offset');
}

$goalScaleFactor = 1.15;
$goalBrickW = (int)round($brickW * $goalScaleFactor);
$goalBrickH = (int)round($brickH * $goalScaleFactor);

$ctaFontSize = 36;
$ctaLineHeight = (int)($ctaFontSize * 1.45); // ~52px — roomier line spacing
$ctaLines = [
    'Click to donate ANY monthly amount!',
    'Each brick = 10$ Monthly donations.',
    "Current: $$currentMonthly Goal: $$goalAmount",
];
$ctaLineCount = count($ctaLines);
$ctaBlockH = $ctaLineCount * $ctaLineHeight;
$ctaBandPadY = (int)($ctaFontSize * 0.7);
$ctaMinMargin = 10; // minimum gap above/below the box, so it never touches the wall edge

// Small inset keeps the oversized GOAL brick flush with the top edge instead
// of clipping — there is no large transparent band above the wall anymore.
$topInset = (int)(($goalBrickH - $brickH) / 2);
$bottomPadding = 4;
$canvasW = $maxRowBricks * $brickW;
$canvasH = $topInset + $rows * $brickH + $bottomPadding;

// Very wide walls have fewer rows (shorter canvas). If the text box + margins
// can't fit at the full font size, scale the font down so the box always keeps
// the same (centered) top/bottom spacing and is never clipped.
$requiredH = $ctaBlockH + 2 * $ctaBandPadY + 2 * $ctaMinMargin;
if ($canvasH < $requiredH) {
    $ctaFontSize = max(13, (int)($ctaFontSize * ($canvasH / $requiredH)));
    $ctaLineHeight = (int)($ctaFontSize * 1.45);
    $ctaBlockH = $ctaLineCount * $ctaLineHeight;
    $ctaBandPadY = (int)($ctaFontSize * 0.7);
}

$canvas = imagecreatetruecolor($canvasW, $canvasH);
if ($canvas === false) {
    http_response_code(500);
    exit('Failed to create canvas');
}

imagealphablending($canvas, false);
imagesavealpha($canvas, true);
$transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
imagefill($canvas, 0, 0, $transparent);
imagealphablending($canvas, true);

// --- Create full brick (image only) ---
$resizedBrick = imagecreatetruecolor($brickW, $brickH);
if ($resizedBrick === false) {
    http_response_code(500);
    exit('Failed to create resized brick');
}

imagealphablending($resizedBrick, false);
imagesavealpha($resizedBrick, true);
imagefill($resizedBrick, 0, 0, imagecolorallocatealpha($resizedBrick, 0, 0, 0, 127));
imagecopyresampled($resizedBrick, $srcImage, 0, 0, 0, 0, $brickW, $brickH, $origW, $origH);

// --- Create half brick (from source, before text is added) ---
$halfBrick = imagecreatetruecolor($halfW, $brickH);
if ($halfBrick === false) {
    http_response_code(500);
    exit('Failed to create half brick');
}

imagealphablending($halfBrick, false);
imagesavealpha($halfBrick, true);
imagefill($halfBrick, 0, 0, imagecolorallocatealpha($halfBrick, 0, 0, 0, 127));
imagecopyresampled($halfBrick, $srcImage, 0, 0, 0, 0, $halfW, $brickH, (int)($origW / 2), $origH);

// --- Render text on full brick ---
$brickTextFontSize = 18;
$textStr = '10$';
$textColor = imagecolorallocate($resizedBrick, 0, 0, 0);
$bbox = imageftbbox($brickTextFontSize, 0, $fontPath, $textStr);
if ($bbox === false) {
    http_response_code(500);
    exit('Failed to measure brick text');
}
$textWidth = $bbox[4] - $bbox[6];
$textHeight = $bbox[1] - $bbox[7];
$textX = (int)(($brickW - $textWidth) / 2);
$textY = (int)(($brickH + $textHeight) / 2);
if (imagettftext($resizedBrick, $brickTextFontSize, 0, $textX, $textY, $textColor, $fontPath, $textStr) === false) {
    http_response_code(500);
    exit('Failed to render brick text');
}

// --- Render text on half brick ---
$halfTextColor = imagecolorallocate($halfBrick, 0, 0, 0);
$halfTextX = (int)(($halfW - $textWidth) / 2);
$halfTextY = (int)(($brickH + $textHeight) / 2);
if (imagettftext($halfBrick, $brickTextFontSize, 0, $halfTextX, $halfTextY, $halfTextColor, $fontPath, $textStr) === false) {
    http_response_code(500);
    exit('Failed to render half brick text');
}

// --- Create ghost bricks (faint brick on white background, for missing donations) ---
$brickOnWhite = imagecreatetruecolor($brickW, $brickH);
imagefill($brickOnWhite, 0, 0, imagecolorallocate($brickOnWhite, 255, 255, 255));
imagealphablending($brickOnWhite, true);
imagecopyresampled($brickOnWhite, $srcImage, 0, 0, 0, 0, $brickW, $brickH, $origW, $origH);

$ghostFullBrick = imagecreatetruecolor($brickW, $brickH);
if ($ghostFullBrick === false) {
    http_response_code(500);
    exit('Failed to create ghost full brick');
}
$ghostWhite = imagecolorallocate($ghostFullBrick, 255, 255, 255);
imagefill($ghostFullBrick, 0, 0, $ghostWhite);
imagecopymerge($ghostFullBrick, $brickOnWhite, 0, 0, 0, 0, $brickW, $brickH, 20);

$ghostHalfBrick = imagecreatetruecolor($halfW, $brickH);
if ($ghostHalfBrick === false) {
    http_response_code(500);
    exit('Failed to create ghost half brick');
}
imagecopy($ghostHalfBrick, $ghostFullBrick, 0, 0, 0, 0, $halfW, $brickH);

// --- Create goal brick (slightly larger, fully opaque, with "GOAL" text) ---
$goalBrick = imagecreatetruecolor($goalBrickW, $goalBrickH);
if ($goalBrick === false) {
    http_response_code(500);
    exit('Failed to create goal brick canvas');
}
imagealphablending($goalBrick, false);
imagesavealpha($goalBrick, true);
imagefill($goalBrick, 0, 0, imagecolorallocatealpha($goalBrick, 0, 0, 0, 127));
imagecopyresampled($goalBrick, $srcImage, 0, 0, 0, 0, $goalBrickW, $goalBrickH, $origW, $origH);

$goalTextFontSize = 20;
$goalTextStr = 'GOAL';
$goalTextColor = imagecolorallocate($goalBrick, 255, 255, 255);
$goalTextShadowColor = imagecolorallocate($goalBrick, 0, 0, 0);
$goalBbox = imageftbbox($goalTextFontSize, 0, $fontPath, $goalTextStr);
if ($goalBbox === false) {
    http_response_code(500);
    exit('Failed to measure goal text');
}
$goalTextWidth = $goalBbox[4] - $goalBbox[6];
$goalTextHeight = $goalBbox[1] - $goalBbox[7];
$goalTextX = (int)(($goalBrickW - $goalTextWidth) / 2);
$goalTextY = (int)(($goalBrickH + $goalTextHeight) / 2);
$goalShadowOffsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
foreach ($goalShadowOffsets as $off) {
    if (imagettftext($goalBrick, $goalTextFontSize, 0, $goalTextX + $off[0], $goalTextY + $off[1], $goalTextShadowColor, $fontPath, $goalTextStr) === false) {
        http_response_code(500);
        exit('Failed to render goal text shadow');
    }
}
if (imagettftext($goalBrick, $goalTextFontSize, 0, $goalTextX, $goalTextY, $goalTextColor, $fontPath, $goalTextStr) === false) {
    http_response_code(500);
    exit('Failed to render goal text');
}

// --- Helper: map flat index to (row, posInRow) with variable row capacities ---
function indexToRowPos($index, $maxRowBricks)
{
    $row = 0;
    $posInRow = $index;
    while (true) {
        $capacity = ($row % 2 === 0) ? ($maxRowBricks + 1) : $maxRowBricks;
        if ($posInRow < $capacity) {
            return [$row, $posInRow];
        }
        $posInRow -= $capacity;
        $row++;
    }
}

// --- Helper: get x,y pixel position for a brick index (rows grow from bottom up) ---
function getBrickPosition($index, $maxRowBricks, $halfW, $brickW, $brickH, $topInset, $rows, $canvasH, $bottomPadding, $canvasW)
{
    list($row, $posInRow) = indexToRowPos($index, $maxRowBricks);
    $y = $canvasH - $bottomPadding - ($row + 1) * $brickH;

    if ($row % 2 === 0) {
        $capacity = $maxRowBricks + 1;
        if ($posInRow === 0) {
            $x = 0;
            $useHalf = true;
        } elseif ($posInRow === $capacity - 1) {
            $x = $canvasW - $halfW;
            $useHalf = true;
        } else {
            $x = $halfW + ($posInRow - 1) * $brickW;
            $useHalf = false;
        }
    } else {
        $x = $posInRow * $brickW;
        $useHalf = false;
    }

    return ['x' => $x, 'y' => $y, 'useHalf' => $useHalf];
}

// Total brick capacity across all rows — used to fill the top row completely
// so the wall never has transparent gaps at its top edge.
$totalCapacity = 0;
for ($r = 0; $r < $rows; $r++) {
    $totalCapacity += ($r % 2 === 0) ? ($maxRowBricks + 1) : $maxRowBricks;
}

// --- 1. Place GHOST bricks (positions $currentBricks to $totalCapacity - 1,
// excluding the GOAL slot which is drawn separately) ---
for ($i = $currentBricks; $i < $totalCapacity; $i++) {
    if ($i === $goalBricks) {
        continue;
    }
    $pos = getBrickPosition($i, $maxRowBricks, $halfW, $brickW, $brickH, $topInset, $rows, $canvasH, $bottomPadding, $canvasW);
    if ($pos['useHalf']) {
        imagecopy($canvas, $ghostHalfBrick, $pos['x'], $pos['y'], 0, 0, $halfW, $brickH);
    } else {
        imagecopy($canvas, $ghostFullBrick, $pos['x'], $pos['y'], 0, 0, $brickW, $brickH);
    }
}

// --- 2. Place REAL bricks (positions 0 to $currentBricks - 1) ---
for ($i = 0; $i < $currentBricks; $i++) {
    $pos = getBrickPosition($i, $maxRowBricks, $halfW, $brickW, $brickH, $topInset, $rows, $canvasH, $bottomPadding, $canvasW);
    if ($pos['useHalf']) {
        imagecopy($canvas, $halfBrick, $pos['x'], $pos['y'], 0, 0, $halfW, $brickH);
    } else {
        imagecopy($canvas, $resizedBrick, $pos['x'], $pos['y'], 0, 0, $brickW, $brickH);
    }
}

// --- 3. Place GOAL brick (position $goalBricks, slightly larger, centered) ---
$goalPos = getBrickPosition($goalBricks, $maxRowBricks, $halfW, $brickW, $brickH, $topInset, $rows, $canvasH, $bottomPadding, $canvasW);
$goalOffsetX = (int)(($brickW - $goalBrickW) / 2);
$goalOffsetY = (int)(($brickH - $goalBrickH) / 2);
imagecopy($canvas, $goalBrick, $goalPos['x'] + $goalOffsetX, $goalPos['y'] + $goalOffsetY, 0, 0, $goalBrickW, $goalBrickH);

// --- 4. Place FLYING brick (rotated, at position $currentBricks) ---
if ($currentBricks > 0) {
    $flyingPos = getBrickPosition($currentBricks, $maxRowBricks, $halfW, $brickW, $brickH, $topInset, $rows, $canvasH, $bottomPadding, $canvasW);
    $flyingSrc = $flyingPos['useHalf'] ? $halfBrick : $resizedBrick;
    $flyingW = $flyingPos['useHalf'] ? $halfW : $brickW;
    // Clamp the lift so the flying brick never pokes above the canvas top now
    // that there is no padding band.
    $liftY = min((int)($brickH * 0.35), $flyingPos['y']);
    $rotateAngle = -8;
    $bgTransparent = imagecolorallocatealpha($flyingSrc, 0, 0, 0, 127);
    $rotatedBrick = imagerotate($flyingSrc, $rotateAngle, $bgTransparent);
    if ($rotatedBrick === false) {
        http_response_code(500);
        exit('Failed to rotate brick');
    }
    imagealphablending($rotatedBrick, false);
    imagesavealpha($rotatedBrick, true);

    $rotW = imagesx($rotatedBrick);
    $rotH = imagesy($rotatedBrick);
    $drawX = $flyingPos['x'] - (int)(($rotW - $flyingW) / 2);
    $drawY = $flyingPos['y'] - $liftY - (int)(($rotH - $brickH) / 2);

    imagecopy($canvas, $rotatedBrick, $drawX, $drawY, 0, 0, $rotW, $rotH);
}

// --- 5. CTA text (centered over the wall, on a plain dark box) ---
$ctaTextColor = imagecolorallocate($canvas, 255, 255, 255);
$ctaShadowColor = imagecolorallocate($canvas, 0, 0, 0);
$ctaBandColor = imagecolorallocatealpha($canvas, 0, 0, 0, 60); // ~53% opaque
$ctaBlockTop = (int)(($canvasH - $ctaBlockH) / 2);

// Measure each line so the block can be centered horizontally as a whole.
$lineWidths = [];
$lineHeights = [];
$maxLineWidth = 0;
foreach ($ctaLines as $ctaLine) {
    $bbox = imageftbbox($ctaFontSize, 0, $fontPath, $ctaLine);
    if ($bbox === false) {
        http_response_code(500);
        exit('Failed to measure CTA text');
    }
    $lineWidths[] = $bbox[4] - $bbox[6];
    $lineHeights[] = $bbox[1] - $bbox[7];
    $maxLineWidth = max($maxLineWidth, $lineWidths[count($lineWidths) - 1]);
}

// Plain semi-transparent dark box behind the text (a clean rectangle — no
// rounded corners that can render as weird artifacts).
$bandPadX = (int)($ctaFontSize * 1.1);
$bandPadY = $ctaBandPadY;
$bandX = (int)(($canvasW - $maxLineWidth) / 2) - $bandPadX;
$bandY = $ctaBlockTop - $bandPadY;
$bandW = $maxLineWidth + $bandPadX * 2;
$bandH = $ctaBlockH + $bandPadY * 2;
imagefilledrectangle($canvas, $bandX, $bandY, $bandX + $bandW, $bandY + $bandH, $ctaBandColor);

// Bold white text with a subtle dark shadow for extra definition.
$shadowOffsets = [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
foreach ($ctaLines as $lineIndex => $ctaLine) {
    $lineX = (int)(($canvasW - $lineWidths[$lineIndex]) / 2);
    $lineY = $ctaBlockTop + $lineIndex * $ctaLineHeight + (int)(($ctaLineHeight + $lineHeights[$lineIndex]) / 2);
    foreach ($shadowOffsets as $off) {
        if (imagettftext($canvas, $ctaFontSize, 0, $lineX + $off[0], $lineY + $off[1], $ctaShadowColor, $fontPath, $ctaLine) === false) {
            http_response_code(500);
            exit('Failed to render CTA shadow');
        }
    }
    if (imagettftext($canvas, $ctaFontSize, 0, $lineX, $lineY, $ctaTextColor, $fontPath, $ctaLine) === false) {
        http_response_code(500);
        exit('Failed to render CTA text');
    }
}

// --- Output ---
header('Content-Type: image/png');
if ($isDevServer) {
    header('Cache-Control: no-store');
} else {
    header('Cache-Control: public, max-age=3600');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
}
imagealphablending($canvas, false);
imagesavealpha($canvas, true);

ob_start();
imagepng($canvas);
$imageData = ob_get_clean();

if ($imageData === false) {
    http_response_code(500);
    exit('Failed to render image');
}

if (!$isDevServer) {
    $cacheWritten = file_put_contents($cacheFile, $imageData);
    if ($cacheWritten === false) {
        error_log("donations.php: failed to write cache file {$cacheFile}");
    }
}

echo $imageData;
