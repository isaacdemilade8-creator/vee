<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StoryResource;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        $visibleUserIds = $authUser->following()->pluck('users.id')->push($authUser->id)->unique();

        $stories = Story::query()
            ->with('user')
            ->whereIn('user_id', $visibleUserIds)
            ->where('expires_at', '>', now())
            ->oldest()
            ->get()
            ->groupBy('user_id')
            ->values()
            ->map(fn($group) => [
                'user' => new \App\Http\Resources\UserResource($group->first()->user),
                'stories' => StoryResource::collection($group),
                'has_unviewed' => $group->contains(fn($story) => !$story->views()->where('user_id', $authUser->id)->exists()),
            ]);

        return response()->json(['story_groups' => $stories]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media' => ['required', 'file', 'max:' . config('app.max_media_size_kb', 51200)],
            'caption' => ['nullable', 'string', 'max:280'],
        ]);

        $file = $request->file('media');
        $mimeType = (string) $file->getMimeType();
        if (!str_starts_with($mimeType, 'image/') && !str_starts_with($mimeType, 'video/')) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => [
                    'media' => ["Unsupported story media type: {$mimeType}."],
                ],
            ], 422);
        }

        $mediaType = str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'image';
        $path = $file->store('stories', 'public');

        $story = $request->user()->stories()->create([
            'media' => $path,
            'media_type' => $mediaType,
            'caption' => $validated['caption'] ?? null,
            'expires_at' => now()->addDay(),
        ]);

        return response()->json([
            'story' => new StoryResource($story->load('user')),
        ], 201);
    }

    public function userStories(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();
        $stories = $user->stories()
            ->with('user')
            ->where('expires_at', '>', now())
            ->oldest()
            ->get();

        return response()->json([
            'user' => new \App\Http\Resources\UserResource($user),
            'stories' => StoryResource::collection($stories),
        ]);
    }

    public function view(Request $request, Story $story): JsonResponse
    {
        if ($story->expires_at <= now()) {
            abort(404, 'Story expired.');
        }

        $story->views()->firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json([
            'story' => new StoryResource($story->load('user')),
        ]);
    }

    public function destroy(Request $request, Story $story): JsonResponse
    {
        if ($story->user_id !== $request->user()->id) {
            abort(403, 'You cannot delete this story.');
        }

        Storage::disk('public')->delete($story->media);
        $story->delete();

        return response()->json(['message' => 'Story deleted.']);
    }
}
