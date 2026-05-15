<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', Rule::in(['ios', 'android', 'web'])],
            'device_id' => ['nullable', 'string', 'max:255'],
        ]);

        PushToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'] ?? null,
                'device_id' => $validated['device_id'] ?? null,
                'enabled' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Push token registered.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->pushTokens()
            ->where('token', $validated['token'])
            ->update(['enabled' => false]);

        return response()->json([
            'message' => 'Push token disabled.',
        ]);
    }
}
