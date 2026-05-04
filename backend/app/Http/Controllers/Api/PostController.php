<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Hashtag;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\PostShare;
use App\Models\PostView;
use App\Models\Repost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * PostController
 *
 * Handles creating, reading, and deleting posts.
 * The feed returns posts from all users (explore) or
 * from followed users (home feed) based on query param.
 */
class PostController extends Controller
{
    /**
     * Get the home feed - posts from followed users + own posts.
     * Falls back to all posts if user follows nobody.
     *
     * GET /api/posts/feed
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get the IDs of users this person follows
        $followingIds = $user->following()->pluck('users.id');

        // Include the user's own posts in their feed
        $followingIds->push($user->id);

        // If following nobody, fall back to all posts (explore mode)
        $query = $followingIds->count() > 1
            ? Post::whereIn('user_id', $followingIds)
            : Post::query();

        $posts = $query
            ->with(['user', 'comments.user', 'likes', 'hashtags'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta'  => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'has_more'     => $posts->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get all posts (explore / discover).
     *
     * GET /api/posts
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $posts = Post::with(['user', 'comments.user', 'hashtags'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta'  => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'has_more'     => $posts->hasMorePages(),
            ],
        ]);
    }

    /**
     * Create a new post with image or video upload.
     *
     * POST /api/posts
     *
     * @param  StorePostRequest  $request
     * @return JsonResponse
     */
    public function store(StorePostRequest $request): JsonResponse
    {
        $mediaFile = $request->file('media') ?: $request->file('image');
        $postType = $request->post_type === 'image' || $request->post_type === 'video'
            ? 'media'
            : $request->post_type;
        $mediaType = $postType === 'poll' ? 'poll' : ($postType === 'text' ? 'text' : null);
        $mediaPath = null;

        if ($mediaFile) {
            $mimeType = $mediaFile->getMimeType();
            $mediaType = match (true) {
                str_starts_with($mimeType, 'video/') => 'video',
                str_starts_with($mimeType, 'audio/') => 'audio',
                default => 'image',
            };
            $postType = $mediaType === 'audio' ? 'audio' : 'media';
            $mediaPath = $mediaFile->store($mediaType === 'audio' ? 'audio' : 'posts', 'public');
        }

        $post = $request->user()->posts()->create([
            'post_type'  => $postType,
            'image'      => $mediaPath,
            'media_type' => $mediaType,
            'caption'    => $request->caption,
            'poll_options' => $postType === 'poll'
                ? collect($request->poll_options)->map(fn($option) => trim($option))->values()->all()
                : null,
            'poll_expires_at' => $postType === 'poll'
                ? now()->addHours((int) $request->input('poll_expires_hours', 24))
                : null,
        ]);

        $this->syncHashtags($post, $request->caption);

        // Load the user relationship for the resource response
        $post->load(['user', 'hashtags']);

        return response()->json([
            'message' => 'Post created successfully.',
            'post'    => new PostResource($post),
        ], 201);
    }

    /**
     * Get a single post by ID.
     *
     * GET /api/posts/{post}
     *
     * @param  Request  $request
     * @param  Post     $post
     * @return JsonResponse
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        $this->markViewedBy($post, $request->user()->id);
        $post->load(['user', 'comments.user', 'likes', 'hashtags']);

        return response()->json([
            'post' => new PostResource($post),
        ]);
    }

    public function view(Request $request, Post $post): JsonResponse
    {
        $this->markViewedBy($post, $request->user()->id);

        return response()->json([
            'views_count' => $post->views()->count(),
        ]);
    }

    /**
     * Delete a post (owner only).
     *
     * DELETE /api/posts/{post}
     *
     * @param  Request  $request
     * @param  Post     $post
     * @return JsonResponse
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        // Ensure only the post owner can delete it
        if ($request->user()->id !== $post->user_id) {
            return response()->json([
                'message' => 'You are not authorized to delete this post.',
            ], 403);
        }

        // Remove the stored media file to free up disk space
        if ($post->image) {
            Storage::disk('public')->delete($post->image);
        }

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully.',
        ]);
    }

    public function repost(Request $request, Post $post): JsonResponse
    {
        $existing = Repost::where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $reposted = false;
        } else {
            Repost::create([
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ]);
            $reposted = true;
        }

        return response()->json([
            'reposted' => $reposted,
            'reposts_count' => $post->reposts()->count(),
        ]);
    }

    public function share(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['nullable', 'string', 'max:40'],
        ]);

        PostShare::create([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
            'channel' => $validated['channel'] ?? 'system',
        ]);

        return response()->json([
            'shares_count' => $post->shares()->count(),
        ]);
    }

    public function analytics(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id !== $request->user()->id) {
            abort(403, 'Only the creator can view analytics for this post.');
        }

        return response()->json([
            'analytics' => [
                'likes' => $post->likes()->count(),
                'comments' => $post->comments()->count(),
                'shares' => $post->shares()->count(),
                'reposts' => $post->reposts()->count(),
                'views' => $post->views()->count(),
                'engagements' => $post->likes()->count()
                    + $post->comments()->count()
                    + $post->shares()->count()
                    + $post->reposts()->count(),
                'recent_likers' => $post->likes()->with('user')->latest()->take(5)->get()->map(fn($like) => [
                    'id' => $like->user->id,
                    'username' => $like->user->username,
                    'avatar_url' => $like->user->avatar_url,
                ]),
                'recent_comments' => $post->comments()->with('user')->latest()->take(5)->get()->map(fn($comment) => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'user' => [
                        'id' => $comment->user->id,
                        'username' => $comment->user->username,
                        'avatar_url' => $comment->user->avatar_url,
                    ],
                    'created_at' => $comment->created_at->toIso8601String(),
                ]),
            ],
        ]);
    }

    public function votePoll(Request $request, Post $post): JsonResponse
    {
        if ($post->post_type !== 'poll' || !$post->poll_options) {
            return response()->json(['message' => 'This post is not a poll.'], 422);
        }

        if ($post->poll_expires_at && $post->poll_expires_at->isPast()) {
            return response()->json(['message' => 'This poll has ended.'], 422);
        }

        $validated = $request->validate([
            'option_index' => ['required', 'integer', 'min:0', 'max:' . (count($post->poll_options) - 1)],
        ]);

        PollVote::updateOrCreate([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
        ], [
            'option_index' => $validated['option_index'],
        ]);

        $post->load(['user', 'comments.user', 'likes', 'hashtags']);

        return response()->json([
            'message' => 'Vote saved.',
            'post' => new PostResource($post),
        ]);
    }

    private function syncHashtags(Post $post, ?string $caption): void
    {
        preg_match_all('/#([a-zA-Z0-9_]+)/', $caption ?? '', $matches);
        $tagIds = collect($matches[1] ?? [])
            ->map(fn($tag) => strtolower($tag))
            ->unique()
            ->map(fn($tag) => Hashtag::firstOrCreate([
                'name' => $tag,
            ], [
                'category' => $this->guessCategory($tag),
            ])->id)
            ->all();

        $post->hashtags()->sync($tagIds);
    }

    private function markViewedBy(Post $post, int $userId): void
    {
        PostView::firstOrCreate([
            'post_id' => $post->id,
            'user_id' => $userId,
        ]);
    }

    private function guessCategory(string $tag): string
    {
        $categories = [
            'entertainment' => ['music', 'movie', 'film', 'comedy', 'dance', 'celebrity', 'art'],
            'education' => ['learn', 'school', 'study', 'coding', 'science', 'history', 'math'],
            'sports' => ['football', 'soccer', 'basketball', 'fitness', 'gym', 'sport', 'tennis'],
            'technology' => ['tech', 'ai', 'code', 'developer', 'software', 'gadget'],
            'lifestyle' => ['food', 'travel', 'fashion', 'beauty', 'home', 'life'],
        ];

        foreach ($categories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($tag, $keyword)) {
                    return $category;
                }
            }
        }

        return 'trending';
    }
}
