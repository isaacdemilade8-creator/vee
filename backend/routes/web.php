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

    return response()->file($disk->path($path), [
        'Content-Type' => $disk->mimeType($path) ?: 'application/octet-stream',
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('path', '.*');
