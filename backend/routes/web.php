<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return new JsonResponse([
        'name' => config('app.name'),
        'status' => 'ok',
    ]);
});

Route::get('/login', function () {
    return new JsonResponse([
        'message' => 'Unauthenticated.',
    ], 401);
})->name('login');

Route::get('/storage/{path}', function (string $path) {
    $path = ltrim($path, '/');

    if ($path === '' || str_contains($path, '..') || str_starts_with($path, '/')) {
        abort(404);
    }

    $basePath = storage_path('app/public');
    $absolutePath = $basePath . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $realBasePath = realpath($basePath);
    $realPath = realpath($absolutePath);

    if (!$realBasePath || !$realPath || !str_starts_with($realPath, $realBasePath) || !is_file($realPath)) {
        abort(404);
    }

    $extension = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'mp4' => 'video/mp4',
        'mov' => 'video/quicktime',
        'm4a' => 'audio/mp4',
        'mp3' => 'audio/mpeg',
        'wav' => 'audio/wav',
    ];
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    $fileSize = filesize($realPath);

    return response()->stream(function () use ($realPath) {
        $handle = fopen($realPath, 'rb');
        if ($handle === false) {
            return;
        }

        fpassthru($handle);
        fclose($handle);
    }, 200, [
        'Content-Length' => (string) $fileSize,
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('path', '.*');
