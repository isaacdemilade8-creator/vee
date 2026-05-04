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
