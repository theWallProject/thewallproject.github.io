<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$currentAmount = 47;
$goalAmount = 500;
$maxRowBricks = max(3, min(100, intval($_GET['maxRowBricks'] ?? 30)));
$maxBrickDimension = 120;

$currentBricks = intdiv($currentAmount, 10);
$goalBricks = intdiv($goalAmount, 10);
if ($goalBricks <= $currentBricks) {
    $goalBricks = $currentBricks + 1;
}
$totalPositions = $goalBricks + 1;

$brickPath = __DIR__ . '/../files/common/brick.png';
$fontPath = __DIR__ . '/../files/common/Roboto-Variable.ttf';

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
    exit('Brick image not found');
}

if (!file_exists($fontPath) || !is_readable($fontPath)) {
    http_response_code(500);
    exit('Font file not found');
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

$rows = (int)ceil($totalPositions / $maxRowBricks);
$halfW = (int)($brickW / 2);

if ($halfW <= 0) {
    http_response_code(500);
    exit('Brick too small for half-width offset');
}

$goalScaleFactor = 1.15;
$goalBrickW = (int)round($brickW * $goalScaleFactor);
$goalBrickH = (int)round($brickH * $goalScaleFactor);

$topPadding = (int)($brickH * 2) + 60;
$bottomPadding = 4;
$canvasW = $maxRowBricks * $brickW;
$canvasH = $topPadding + $rows * $brickH + $bottomPadding;

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

imagedestroy($brickOnWhite);

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

// --- Helper: get x,y pixel position for a brick index (rows grow from bottom up) ---
function getBrickPosition($index, $maxRowBricks, $halfW, $brickW, $brickH, $topPadding, $rows, $canvasH, $bottomPadding) {
    $row = (int)floor($index / $maxRowBricks);
    $posInRow = $index % $maxRowBricks;
    $y = $canvasH - $bottomPadding - ($row + 1) * $brickH;

    if ($row % 2 === 0) {
        if ($posInRow === 0) {
            $x = 0;
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

// --- 1. Place GHOST bricks (positions $currentBricks to $goalBricks - 1) ---
for ($i = $currentBricks; $i < $goalBricks; $i++) {
    $pos = getBrickPosition($i, $maxRowBricks, $halfW, $brickW, $brickH, $topPadding, $rows, $canvasH, $bottomPadding);
    if ($pos['useHalf']) {
        imagecopy($canvas, $ghostHalfBrick, $pos['x'], $pos['y'], 0, 0, $halfW, $brickH);
    } else {
        imagecopy($canvas, $ghostFullBrick, $pos['x'], $pos['y'], 0, 0, $brickW, $brickH);
    }
}

// --- 2. Place REAL bricks (positions 0 to $currentBricks - 1) ---
for ($i = 0; $i < $currentBricks; $i++) {
    $pos = getBrickPosition($i, $maxRowBricks, $halfW, $brickW, $brickH, $topPadding, $rows, $canvasH, $bottomPadding);
    if ($pos['useHalf']) {
        imagecopy($canvas, $halfBrick, $pos['x'], $pos['y'], 0, 0, $halfW, $brickH);
    } else {
        imagecopy($canvas, $resizedBrick, $pos['x'], $pos['y'], 0, 0, $brickW, $brickH);
    }
}

// --- 3. Place GOAL brick (position $goalBricks, slightly larger, centered) ---
$goalPos = getBrickPosition($goalBricks, $maxRowBricks, $halfW, $brickW, $brickH, $topPadding, $rows, $canvasH, $bottomPadding);
$goalOffsetX = (int)(($brickW - $goalBrickW) / 2);
$goalOffsetY = (int)(($brickH - $goalBrickH) / 2);
imagecopy($canvas, $goalBrick, $goalPos['x'] + $goalOffsetX, $goalPos['y'] + $goalOffsetY, 0, 0, $goalBrickW, $goalBrickH);

// --- 4. Place FLYING brick (rotated, at position $currentBricks) ---
if ($currentBricks > 0) {
    $flyingPos = getBrickPosition($currentBricks, $maxRowBricks, $halfW, $brickW, $brickH, $topPadding, $rows, $canvasH, $bottomPadding);
    $liftY = (int)($brickH * 0.35);
    $rotateAngle = -8;
    $bgTransparent = imagecolorallocatealpha($resizedBrick, 0, 0, 0, 127);
    $rotatedBrick = imagerotate($resizedBrick, $rotateAngle, $bgTransparent);
    if ($rotatedBrick === false) {
        http_response_code(500);
        exit('Failed to rotate brick');
    }
    imagealphablending($rotatedBrick, false);
    imagesavealpha($rotatedBrick, true);

    $rotW = imagesx($rotatedBrick);
    $rotH = imagesy($rotatedBrick);
    $drawX = $flyingPos['x'] - (int)(($rotW - $brickW) / 2);
    $drawY = $flyingPos['y'] - $liftY - (int)(($rotH - $brickH) / 2);

    imagecopy($canvas, $rotatedBrick, $drawX, $drawY, 0, 0, $rotW, $rotH);
    imagedestroy($rotatedBrick);
}

// --- 5. CTA text (2 lines, left-aligned, white) ---
$ctaFontSize = 36;
$ctaText1 = "Click to donate ANY monthly amount!";
$ctaText2 = "Each brick = 10$ Monthly donations. Current: $currentAmount Goal: $goalAmount)";
$ctaShadowColor = imagecolorallocate($canvas, 0, 0, 0);
$ctaColor = imagecolorallocate($canvas, 255, 255, 255);
$ctaX = 4;
$ctaLineHeight = (int)($ctaFontSize * 1.3);
$ctaY1 = $topPadding - 30 - $ctaLineHeight;
$ctaY2 = $ctaY1 + $ctaLineHeight;
$shadowOffsets = [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];

foreach ([$ctaText1, $ctaText2] as $lineIndex => $ctaLine) {
    $ctaY = $lineIndex === 0 ? $ctaY1 : $ctaY2;
    foreach ($shadowOffsets as $off) {
        if (imagettftext($canvas, $ctaFontSize, 0, $ctaX + $off[0], $ctaY + $off[1], $ctaShadowColor, $fontPath, $ctaLine) === false) {
            http_response_code(500);
            exit('Failed to render CTA shadow');
        }
    }
    if (imagettftext($canvas, $ctaFontSize, 0, $ctaX, $ctaY, $ctaColor, $fontPath, $ctaLine) === false) {
        http_response_code(500);
        exit('Failed to render CTA text');
    }
}

// --- Output ---
header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
imagealphablending($canvas, false);
imagesavealpha($canvas, true);
imagepng($canvas);

imagedestroy($canvas);
imagedestroy($srcImage);
imagedestroy($resizedBrick);
imagedestroy($halfBrick);
imagedestroy($ghostFullBrick);
imagedestroy($ghostHalfBrick);
imagedestroy($goalBrick);