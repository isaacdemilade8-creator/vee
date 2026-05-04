<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use App\Notifications\LikedPostNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * LikeController
 *
 * Handles liking and unliking posts.
 * Toggle behavior: calling like on an already-liked post will unlike it.
 */
class LikeController extends Controller
{
    /**
     * Toggle a like on a post for the authenticated user.
     *
     * POST /api/posts/{post}/like
     *
     * @param  Request  $request
     * @param  Post     $post
     * @return JsonResponse
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        // Check if the user already liked this post
        $existingLike = Like::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        if ($existingLike) {
            // Unlike — remove the like
            $existingLike->delete();
            $liked = false;
            $message = 'Post unliked.';
        } else {
            // Like — create a new like
            Like::create([
                'user_id' => $user->id,
                'post_id' => $post->id,
            ]);
            $liked = true;
            $message = 'Post liked.';

            // Notify the post owner (but not if they like their own post)
            if ($post->user_id !== $user->id) {
                $post->user->notify(new LikedPostNotification($user, $post));
            }
        }

        // Return the updated like count
        $likesCount = $post->likes()->count();

        return response()->json([
            'message'     => $message,
            'liked'       => $liked,
            'likes_count' => $likesCount,
        ]);
    }

    /**
     * Get a list of users who liked a specific post.
     *
     * GET /api/posts/{post}/likes
     *
     * @param  Request  $request
     * @param  Post     $post
     * @return JsonResponse
     */
    public function index(Request $request, Post $post): JsonResponse
    {
        $likers = $post->likes()
            ->with('user')
            ->latest()
            ->paginate(20);

        return response()->json([
            'likers' => $likers->map(fn($like) => [
                'id'         => $like->user->id,
                'username'   => $like->user->username,
                'full_name'  => $like->user->full_name,
                'avatar_url' => $like->user->avatar_url,
            ]),
            'total'  => $post->likes()->count(),
        ]);
    }
}
