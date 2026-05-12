<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiveStream;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LiveStreamController extends Controller
{
    public function index(): JsonResponse
    {
        $streams = LiveStream::with('user')
            ->where('status', 'active')
            ->latest('started_at')
            ->get()
            ->map(fn (LiveStream $stream) => $this->serializeStream($stream));

        return response()->json(['streams' => $streams]);
    }

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $user = $request->user();
        $stream = LiveStream::where('user_id', $user->id)
            ->where('status', 'active')
            ->latest('started_at')
            ->first();

        if (!$stream) {
            $stream = LiveStream::create([
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'room_name' => 'vee-live-' . $user->id . '-' . Str::lower(Str::random(10)),
                'status' => 'active',
                'started_at' => now(),
            ]);
        }

        return $this->join($request, $stream);
    }

    public function join(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        $user = $request->user();
        $isHost = (int) $liveStream->user_id === (int) $user->id;
        $token = $this->makeToken($liveStream, $user, $isHost);

        if (!$token) {
            return response()->json(['message' => 'Live streaming is not configured yet.'], 503);
        }

        return response()->json([
            'stream' => $this->serializeStream($liveStream->loadMissing('user')),
            'livekit' => [
                'url' => config('livekit.url'),
                'token' => $token,
                'role' => $isHost ? 'host' : 'viewer',
            ],
        ]);
    }

    public function end(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ((int) $liveStream->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Only the host can end this live stream.'], 403);
        }

        if ($liveStream->isActive()) {
            $liveStream->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);
        }

        return response()->json(['stream' => $this->serializeStream($liveStream->fresh('user'))]);
    }

    private function makeToken(LiveStream $stream, $user, bool $isHost): ?string
    {
        $apiKey = config('livekit.api_key');
        $apiSecret = config('livekit.api_secret');

        if (!$apiKey || !$apiSecret || !config('livekit.url')) {
            return null;
        }

        $now = time();
        $videoGrant = [
            'room' => $stream->room_name,
            'roomJoin' => true,
            'canSubscribe' => true,
            'canPublish' => $isHost,
            'canPublishData' => true,
        ];

        if ($isHost) {
            $videoGrant['canPublishSources'] = ['camera', 'microphone'];
        }

        $payload = [
            'iss' => $apiKey,
            'sub' => 'user-' . $user->id,
            'name' => $user->full_name ?: $user->username,
            'nbf' => $now - 10,
            'exp' => $now + config('livekit.token_ttl'),
            'metadata' => json_encode([
                'user_id' => $user->id,
                'username' => $user->username,
                'role' => $isHost ? 'host' : 'viewer',
            ]),
            'video' => $videoGrant,
        ];

        return $this->signJwt($payload, $apiSecret);
    }

    private function signJwt(array $payload, string $secret): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            $this->base64Url(json_encode($header)),
            $this->base64Url(json_encode($payload)),
        ];
        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = $this->base64Url($signature);

        return implode('.', $segments);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function serializeStream(LiveStream $stream): array
    {
        return [
            'id' => $stream->id,
            'title' => $stream->title,
            'room_name' => $stream->room_name,
            'status' => $stream->status,
            'started_at' => optional($stream->started_at)->toISOString(),
            'ended_at' => optional($stream->ended_at)->toISOString(),
            'host' => [
                'id' => $stream->user?->id,
                'username' => $stream->user?->username,
                'full_name' => $stream->user?->full_name,
                'avatar_url' => $stream->user?->avatar_url,
            ],
        ];
    }
}
