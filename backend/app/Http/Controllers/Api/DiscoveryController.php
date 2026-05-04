<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Hashtag;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscoveryController extends Controller
{
    public function categories(): JsonResponse
    {
        $defaultCategories = ['trending', 'entertainment', 'education', 'sports', 'technology', 'lifestyle'];

        $categories = collect($defaultCategories)->map(function ($category) {
            $hashtags = Hashtag::where('category', $category)
                ->withCount('posts')
                ->orderByDesc('posts_count')
                ->take(8)
                ->get();

            return [
                'key' => $category,
                'label' => ucfirst($category),
                'hashtags' => $hashtags,
                'posts_count' => $category === 'trending'
                    ? Post::count()
                    : $hashtags->sum('posts_count'),
            ];
        });

        return response()->json(['categories' => $categories]);
    }

    public function categoryPosts(Request $request, string $category): JsonResponse
    {
        $query = Post::query();

        if ($category !== 'trending') {
            $query->whereHas('hashtags', fn($hashtagQuery) => $hashtagQuery->where('category', $category));
        }

        $posts = $query
            ->with(['user', 'comments.user', 'hashtags'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'has_more' => $posts->hasMorePages(),
            ],
        ]);
    }

    public function hashtagPosts(Request $request, string $hashtag): JsonResponse
    {
        $tag = strtolower(ltrim($hashtag, '#'));
        $posts = Post::query()
            ->whereHas('hashtags', fn($query) => $query->where('name', $tag))
            ->with(['user', 'comments.user', 'hashtags'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'hashtag' => $tag,
            'posts' => PostResource::collection($posts),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'has_more' => $posts->hasMorePages(),
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->get('q', ''));

        if (strlen($query) < 2) {
            return response()->json(['posts' => []]);
        }

        $tag = strtolower(ltrim($query, '#'));
        $posts = Post::query()
            ->where(function ($postQuery) use ($query, $tag) {
                $postQuery
                    ->where('caption', 'LIKE', "%{$query}%")
                    ->orWhereHas('hashtags', fn($hashtagQuery) => $hashtagQuery->where('name', 'LIKE', "%{$tag}%"));
            })
            ->with(['user', 'comments.user', 'hashtags'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'has_more' => $posts->hasMorePages(),
            ],
        ]);
    }
}
