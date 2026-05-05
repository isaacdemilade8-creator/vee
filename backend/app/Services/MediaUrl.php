<?php

namespace App\Services;

class MediaUrl
{
    public static function fromPublicDisk(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        $normalizedPath = ltrim(str_replace('\\', '/', $path), '/');

        if (str_starts_with($normalizedPath, 'storage/')) {
            $normalizedPath = substr($normalizedPath, 8);
        }

        return route('media.show', ['path' => $normalizedPath]);
    }
}
