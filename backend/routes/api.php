<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\InboxController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\StoryController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Vee API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api (set in bootstrap/app.php).
| Protected routes require a valid Sanctum token in the
| Authorization: Bearer {token} header.
|
*/

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — No authentication required
// ─────────────────────────────────────────────────────────────────────────────

Route::get('/health', function () {
    return new JsonResponse([
        'ok' => true,
        'app' => config('app.name'),
    ]);
});

Route::prefix('auth')->group(function () {
    // POST /api/auth/register  — Create a new account
    Route::post('/register', [AuthController::class, 'register']);

    // POST /api/auth/login     — Login and receive a token
    Route::post('/login', [AuthController::class, 'login']);
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — Require: Authorization: Bearer {token}
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);  // POST /api/auth/logout
        Route::get('/me',     [AuthController::class, 'me']);       // GET  /api/auth/me
    });

    // ── Profile ───────────────────────────────────────────────────────────────
    Route::get('/profile',             [ProfileController::class, 'myProfile']); // GET own profile
    Route::post('/profile',            [ProfileController::class, 'update']);    // POST update own profile
    Route::get('/users/search',        [ProfileController::class, 'search']);    // GET search users
    Route::get('/users/{username}',    [ProfileController::class, 'show']);      // GET user profile by username
    Route::get('/users/{username}/posts', [ProfileController::class, 'userPosts']); // GET user's posts grid
    Route::get('/users/{username}/reposts', [ProfileController::class, 'userReposts']);

    // ── Follow System ─────────────────────────────────────────────────────────
    Route::post('/users/{username}/follow',    [FollowController::class, 'toggle']);    // POST follow/unfollow
    Route::get('/users/{username}/followers',  [FollowController::class, 'followers']); // GET follower list
    Route::get('/users/{username}/following',  [FollowController::class, 'following']); // GET following list

    // ── Posts ─────────────────────────────────────────────────────────────────
    Route::get('/posts/feed',      [PostController::class, 'feed']);    // GET personalized feed
    Route::get('/posts',           [PostController::class, 'index']);   // GET all posts (explore)
    Route::post('/posts',          [PostController::class, 'store']);   // POST create post
    Route::get('/posts/{post}',    [PostController::class, 'show']);    // GET single post
    Route::delete('/posts/{post}', [PostController::class, 'destroy']); // DELETE post (owner only)
    Route::post('/posts/{post}/view', [PostController::class, 'view']);
    Route::post('/posts/{post}/repost', [PostController::class, 'repost']);
    Route::post('/posts/{post}/share', [PostController::class, 'share']);
    Route::post('/posts/{post}/poll-vote', [PostController::class, 'votePoll']);
    Route::get('/posts/{post}/analytics', [PostController::class, 'analytics']);

    // ── Likes ─────────────────────────────────────────────────────────────────
    Route::post('/posts/{post}/like',  [LikeController::class, 'toggle']); // POST like/unlike toggle
    Route::get('/posts/{post}/likes',  [LikeController::class, 'index']);  // GET list of likers

    // ── Comments ──────────────────────────────────────────────────────────────
    Route::get('/posts/{post}/comments',              [CommentController::class, 'index']);   // GET comments list
    Route::post('/posts/{post}/comments',             [CommentController::class, 'store']);   // POST add comment
    Route::delete('/posts/{post}/comments/{comment}', [CommentController::class, 'destroy']); // DELETE comment

    // ── Notifications ─────────────────────────────────────────────────────────
    Route::get('/notifications',               [NotificationController::class, 'index']);       // GET all notifications
    Route::post('/notifications/read-all',     [NotificationController::class, 'markAllRead']); // POST mark all read
    Route::post('/notifications/{id}/read',    [NotificationController::class, 'markRead']);    // POST mark one read

    Route::get('/conversations', [InboxController::class, 'conversations']);
    Route::post('/conversations', [InboxController::class, 'start']);
    Route::get('/conversations/{conversation}/messages', [InboxController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [InboxController::class, 'send']);

    Route::get('/stories', [StoryController::class, 'index']);
    Route::post('/stories', [StoryController::class, 'store']);
    Route::get('/users/{username}/stories', [StoryController::class, 'userStories']);
    Route::post('/stories/{story}/view', [StoryController::class, 'view']);
    Route::delete('/stories/{story}', [StoryController::class, 'destroy']);

    Route::get('/discover/categories', [DiscoveryController::class, 'categories']);
    Route::get('/discover/search', [DiscoveryController::class, 'search']);
    Route::get('/discover/categories/{category}/posts', [DiscoveryController::class, 'categoryPosts']);
    Route::get('/discover/hashtags/{hashtag}/posts', [DiscoveryController::class, 'hashtagPosts']);
});
