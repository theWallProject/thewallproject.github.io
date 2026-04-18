<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$totalMonthlyEuro = 47;
$totalBricks = intdiv($totalMonthlyEuro, 10); // Each brick represents 5 euros
$maxRowSize = 50;
$maxBrickDimension = 60;

$brickPath = __DIR__ . '/../files/common/brick.png';

if (!function_exists('imagecreatefrompng')) {
    http_response_code(500);
    exit('GD library not available');
}

if (!file_exists($brickPath) || !is_readable($brickPath)) {
    http_response_code(500);
    exit('Brick image not found');
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

$rows = (int)ceil($totalBricks / $maxRowSize);
$canvasW = $maxRowSize * $brickW;
$canvasH = $rows * $brickH;
$halfW = (int)($brickW / 2);

if ($halfW <= 0) {
    http_response_code(500);
    exit('Brick too small for half-width offset');
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

$resizedBrick = imagecreatetruecolor($brickW, $brickH);
if ($resizedBrick === false) {
    http_response_code(500);
    exit('Failed to create resized brick');
}

imagealphablending($resizedBrick, false);
imagesavealpha($resizedBrick, true);
imagefill($resizedBrick, 0, 0, imagecolorallocatealpha($resizedBrick, 0, 0, 0, 127));
imagecopyresampled($resizedBrick, $srcImage, 0, 0, 0, 0, $brickW, $brickH, $origW, $origH);

$textFont = 2;
$textStr = '10$';
$textColor = imagecolorallocate($resizedBrick, 0, 0, 0);
$textWidth = strlen($textStr) * imagefontwidth($textFont);
$textHeight = imagefontheight($textFont);
$textX = (int)(($brickW - $textWidth) / 2);
$textY = (int)(($brickH - $textHeight) / 2);
imagestring($resizedBrick, $textFont, $textX, $textY, $textStr, $textColor);

$halfBrick = imagecreatetruecolor($halfW, $brickH);
if ($halfBrick === false) {
    http_response_code(500);
    exit('Failed to create half brick');
}

imagealphablending($halfBrick, false);
imagesavealpha($halfBrick, true);
imagefill($halfBrick, 0, 0, imagecolorallocatealpha($halfBrick, 0, 0, 0, 127));
imagecopyresampled($halfBrick, $resizedBrick, 0, 0, 0, 0, $halfW, $brickH, $halfW, $brickH);

$halfTextColor = imagecolorallocate($halfBrick, 0, 0, 0);
$halfTextWidth = strlen($textStr) * imagefontwidth($textFont);
$halfTextHeight = imagefontheight($textFont);
$halfTextX = (int)(($halfW - $halfTextWidth) / 2);
$halfTextY = (int)(($brickH - $halfTextHeight) / 2);
imagestring($halfBrick, $textFont, $halfTextX, $halfTextY, $textStr, $halfTextColor);

$bricksPlaced = 0;

for ($row = 0; $row < $rows && $bricksPlaced < $totalBricks; $row++) {
    $y = $row * $brickH;

    if ($row % 2 === 0) {
        $x = 0;
        imagecopy($canvas, $halfBrick, $x, $y, 0, 0, $halfW, $brickH);
        $bricksPlaced++;
        $x += $halfW;

        for ($col = 1; $col < $maxRowSize && $bricksPlaced < $totalBricks; $col++) {
            imagecopy($canvas, $resizedBrick, $x, $y, 0, 0, $brickW, $brickH);
            $bricksPlaced++;
            $x += $brickW;
        }
    } else {
        for ($col = 0; $col < $maxRowSize && $bricksPlaced < $totalBricks; $col++) {
            imagecopy($canvas, $resizedBrick, $col * $brickW, $y, 0, 0, $brickW, $brickH);
            $bricksPlaced++;
        }
    }
}

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