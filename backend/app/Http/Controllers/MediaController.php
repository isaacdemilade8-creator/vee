<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaController extends Controller
{
    public function show(string $path): BinaryFileResponse
    {
        $normalizedPath = ltrim(str_replace('\\', '/', $path), '/');

        if ($normalizedPath === '' || str_contains($normalizedPath, '..')) {
            abort(404);
        }

        $disk = Storage::disk('public');

        if (!$disk->exists($normalizedPath)) {
            abort(404);
        }

        return response()->file($disk->path($normalizedPath), [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
        ]);
    }
}
