<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

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

    $disk = Storage::disk('public');

    if (!$disk->exists($path)) {
        abort(404);
    }

    $absolutePath = $disk->path($path);
    $mimeType = $disk->mimeType($path) ?: 'application/octet-stream';
    $fileSize = $disk->size($path);

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
