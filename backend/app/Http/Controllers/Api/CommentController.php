<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use App\Notifications\CommentedOnPostNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CommentController
 *
 * Handles adding and deleting comments on posts.
 */
class CommentController extends Controller
{
    /**
     * List all comments on a post with pagination.
     *
     * GET /api/posts/{post}/comments
     *
     * @param  Request  $request
     * @param  Post     $post
     * @return JsonResponse
     */
    public function index(Request $request, Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with('user')
            ->latest()
            ->paginate(20);

        return response()->json([
            'comments' => CommentResource::collection($comments),
            'meta'     => [
                'current_page' => $comments->currentPage(),
                'last_page'    => $comments->lastPage(),
                'total'        => $comments->total(),
            ],
        ]);
    }

    /**
     * Add a new comment to a post.
     *
     * POST /api/posts/{post}/comments
     *
     * @param  StoreCommentRequest  $request
     * @param  Post                 $post
     * @return JsonResponse
     */
    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        $user = $request->user();

        $comment = $post->comments()->create([
            'user_id' => $user->id,
            'body'    => $request->body,
        ]);

        $comment->load('user');

        // Notify post owner (skip if commenting on own post)
        if ($post->user_id !== $user->id) {
            $post->user->notify(
                new CommentedOnPostNotification($user, $post, $comment)
            );
        }

        return response()->json([
            'message' => 'Comment added.',
            'comment' => new CommentResource($comment),
        ], 201);
    }

    /**
     * Delete a comment.
     * Only the comment author or the post owner can delete a comment.
     *
     * DELETE /api/posts/{post}/comments/{comment}
     *
     * @param  Request  $request
     * @param  Post     $post
     * @param  Comment  $comment
     * @return JsonResponse
     */
    public function destroy(Request $request, Post $post, Comment $comment): JsonResponse
    {
        $user = $request->user();

        // Verify the comment belongs to this post
        if ($comment->post_id !== $post->id) {
            return response()->json(['message' => 'Comment not found on this post.'], 404);
        }

        // Allow deletion by the comment author OR the post owner
        $canDelete = $user->id === $comment->user_id
            || $user->id === $post->user_id;

        if (!$canDelete) {
            return response()->json([
                'message' => 'You are not authorized to delete this comment.',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted.',
        ]);
    }
}
