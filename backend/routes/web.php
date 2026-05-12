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
    $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $absolutePath = $basePath . DIRECTORY_SEPARATOR . $normalizedPath;

    if (!is_file($absolutePath)) {
        abort(404);
    }

    $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
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
    $fileSize = filesize($absolutePath);

    return response()->stream(function () use ($absolutePath) {
        $handle = fopen($absolutePath, 'rb');
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
