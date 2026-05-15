<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiveStreamCohostRequest;
use App\Models\LiveStreamComment;
use App\Models\LiveStreamReaction;
use App\Models\LiveStreamViewer;
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
        $isCohost = $this->isAcceptedCohost($liveStream, $user);
        $role = $isHost ? 'host' : ($isCohost ? 'cohost' : 'viewer');
        $token = $this->makeToken($liveStream, $user, $role);

        if (!$token) {
            return response()->json(['message' => 'Live streaming is not configured yet.'], 503);
        }

        $this->touchViewer($liveStream, $user);

        return response()->json([
            'stream' => $this->serializeStream($liveStream->loadMissing('user')),
            'livekit' => [
                'url' => config('livekit.url'),
                'token' => $token,
                'role' => $role,
            ],
            'live' => $this->serializeLiveState($liveStream, $user),
        ]);
    }

    public function sync(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        $this->touchViewer($liveStream, $request->user());

        return response()->json([
            'stream' => $this->serializeStream($liveStream->loadMissing('user')),
            'live' => $this->serializeLiveState($liveStream, $request->user()),
        ]);
    }

    public function viewers(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        $this->touchViewer($liveStream, $request->user());

        return response()->json([
            'viewers' => $this->activeViewers($liveStream),
            'guests' => $this->acceptedGuests($liveStream),
            'viewer_count' => $this->viewerCount($liveStream),
        ]);
    }

    public function comment(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:500'],
        ]);

        $comment = LiveStreamComment::create([
            'live_stream_id' => $liveStream->id,
            'user_id' => $request->user()->id,
            'body' => trim($validated['body']),
        ])->load('user');

        $this->touchViewer($liveStream, $request->user());

        return response()->json([
            'comment' => $this->serializeComment($comment),
            'live' => $this->serializeLiveState($liveStream, $request->user()),
        ], 201);
    }

    public function react(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        $validated = $request->validate([
            'type' => ['nullable', 'string', 'max:24'],
        ]);

        LiveStreamReaction::create([
            'live_stream_id' => $liveStream->id,
            'user_id' => $request->user()->id,
            'type' => $validated['type'] ?? 'like',
        ]);

        $this->touchViewer($liveStream, $request->user());

        return response()->json([
            'live' => $this->serializeLiveState($liveStream, $request->user()),
        ]);
    }

    public function requestCohost(Request $request, LiveStream $liveStream): JsonResponse
    {
        if (!$liveStream->isActive()) {
            return response()->json(['message' => 'This live stream has ended.'], 410);
        }

        if ((int) $liveStream->user_id === (int) $request->user()->id) {
            return response()->json(['message' => 'You are already the host.'], 422);
        }

        $cohostRequest = LiveStreamCohostRequest::updateOrCreate(
            ['live_stream_id' => $liveStream->id, 'user_id' => $request->user()->id],
            ['status' => 'pending', 'responded_at' => null]
        )->load('user');

        return response()->json([
            'cohost_request' => $this->serializeCohostRequest($cohostRequest),
            'live' => $this->serializeLiveState($liveStream, $request->user()),
        ], 201);
    }

    public function respondCohost(Request $request, LiveStream $liveStream, LiveStreamCohostRequest $cohostRequest): JsonResponse
    {
        if ((int) $liveStream->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Only the host can manage cohost requests.'], 403);
        }

        if ((int) $cohostRequest->live_stream_id !== (int) $liveStream->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:accepted,declined'],
        ]);

        $cohostRequest->update([
            'status' => $validated['status'],
            'responded_at' => now(),
        ]);

        return response()->json([
            'cohost_request' => $this->serializeCohostRequest($cohostRequest->fresh('user')),
            'live' => $this->serializeLiveState($liveStream, $request->user()),
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

    private function makeToken(LiveStream $stream, $user, string $role): ?string
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
            'canPublish' => in_array($role, ['host', 'cohost'], true),
            'canPublishData' => true,
        ];

        if (in_array($role, ['host', 'cohost'], true)) {
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
                'role' => $role,
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
        $reactionCount = LiveStreamReaction::where('live_stream_id', $stream->id)->count();

        return [
            'id' => $stream->id,
            'title' => $stream->title,
            'room_name' => $stream->room_name,
            'status' => $stream->status,
            'started_at' => optional($stream->started_at)->toISOString(),
            'ended_at' => optional($stream->ended_at)->toISOString(),
            'viewer_count' => $this->viewerCount($stream),
            'reaction_count' => $reactionCount,
            'host' => [
                'id' => $stream->user?->id,
                'username' => $stream->user?->username,
                'full_name' => $stream->user?->full_name,
                'avatar_url' => $stream->user?->avatar_url,
            ],
        ];
    }

    private function touchViewer(LiveStream $stream, $user): void
    {
        if ((int) $stream->user_id === (int) $user->id) {
            return;
        }

        LiveStreamViewer::updateOrCreate(
            ['live_stream_id' => $stream->id, 'user_id' => $user->id],
            ['last_seen_at' => now()]
        );
    }

    private function isAcceptedCohost(LiveStream $stream, $user): bool
    {
        if (!$user) {
            return false;
        }

        return LiveStreamCohostRequest::where('live_stream_id', $stream->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
    }

    private function serializeLiveState(LiveStream $stream, $user): array
    {
        $comments = LiveStreamComment::with('user')
            ->where('live_stream_id', $stream->id)
            ->latest()
            ->limit(40)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (LiveStreamComment $comment) => $this->serializeComment($comment));

        $cohostStatus = LiveStreamCohostRequest::where('live_stream_id', $stream->id)
            ->where('user_id', $user->id)
            ->value('status');

        $pendingRequests = [];
        if ((int) $stream->user_id === (int) $user->id) {
            $pendingRequests = LiveStreamCohostRequest::with('user')
                ->where('live_stream_id', $stream->id)
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(fn (LiveStreamCohostRequest $request) => $this->serializeCohostRequest($request))
                ->values();
        }

        return [
            'comments' => $comments,
            'reaction_count' => LiveStreamReaction::where('live_stream_id', $stream->id)->count(),
            'viewer_count' => $this->viewerCount($stream),
            'viewers' => $this->activeViewers($stream),
            'cohost_status' => $cohostStatus,
            'pending_cohost_requests' => $pendingRequests,
            'accepted_guests' => $this->acceptedGuests($stream),
        ];
    }

    private function viewerCount(LiveStream $stream): int
    {
        return LiveStreamViewer::where('live_stream_id', $stream->id)
            ->where('user_id', '!=', $stream->user_id)
            ->where('last_seen_at', '>=', now()->subSeconds(45))
            ->count();
    }

    private function activeViewers(LiveStream $stream)
    {
        return LiveStreamViewer::with('user')
            ->where('live_stream_id', $stream->id)
            ->where('user_id', '!=', $stream->user_id)
            ->where('last_seen_at', '>=', now()->subSeconds(45))
            ->latest('last_seen_at')
            ->get()
            ->map(fn (LiveStreamViewer $viewer) => [
                'id' => $viewer->user?->id,
                'username' => $viewer->user?->username,
                'full_name' => $viewer->user?->full_name,
                'avatar_url' => $viewer->user?->avatar_url,
                'is_guest' => $this->isAcceptedCohost($stream, $viewer->user),
                'last_seen_at' => optional($viewer->last_seen_at)->toISOString(),
            ])
            ->values();
    }

    private function acceptedGuests(LiveStream $stream)
    {
        return LiveStreamCohostRequest::with('user')
            ->where('live_stream_id', $stream->id)
            ->where('status', 'accepted')
            ->latest('responded_at')
            ->get()
            ->map(fn (LiveStreamCohostRequest $request) => $this->serializeCohostRequest($request))
            ->values();
    }

    private function serializeComment(LiveStreamComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => optional($comment->created_at)->toISOString(),
            'user' => [
                'id' => $comment->user?->id,
                'username' => $comment->user?->username,
                'full_name' => $comment->user?->full_name,
                'avatar_url' => $comment->user?->avatar_url,
            ],
        ];
    }

    private function serializeCohostRequest(LiveStreamCohostRequest $request): array
    {
        return [
            'id' => $request->id,
            'status' => $request->status,
            'created_at' => optional($request->created_at)->toISOString(),
            'user' => [
                'id' => $request->user?->id,
                'username' => $request->user?->username,
                'full_name' => $request->user?->full_name,
                'avatar_url' => $request->user?->avatar_url,
            ],
        ];
    }
}
