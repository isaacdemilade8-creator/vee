<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Notifications\NewFollowerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * FollowController
 *
 * Handles follow/unfollow actions and listing followers/following.
 */
class FollowController extends Controller
{
    /**
     * Follow or unfollow a user (toggle behavior).
     *
     * POST /api/users/{username}/follow
     *
     * @param  Request  $request
     * @param  string   $username
     * @return JsonResponse
     */
    public function toggle(Request $request, string $username): JsonResponse
    {
        $authUser   = $request->user();
        $targetUser = User::where('username', strtolower($username))->firstOrFail();

        // Prevent self-following
        if ($authUser->id === $targetUser->id) {
            return response()->json([
                'message' => 'You cannot follow yourself.',
            ], 422);
        }

        // Check current follow state
        $isFollowing = $authUser->isFollowing($targetUser);

        if ($isFollowing) {
            // Unfollow
            $authUser->following()->detach($targetUser->id);
            $message     = "You unfollowed {$targetUser->username}.";
            $nowFollowing = false;
        } else {
            // Follow
            $authUser->following()->attach($targetUser->id);
            $message     = "You are now following {$targetUser->username}.";
            $nowFollowing = true;

            // Notify the user that someone new followed them
            $targetUser->notify(new NewFollowerNotification($authUser));
        }

        return response()->json([
            'message'          => $message,
            'is_following'     => $nowFollowing,
            'followers_count'  => $targetUser->followers()->count(),
        ]);
    }

    /**
     * List followers of a user.
     *
     * GET /api/users/{username}/followers
     *
     * @param  Request  $request
     * @param  string   $username
     * @return JsonResponse
     */
    public function followers(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();

        $followers = $user->followers()
            ->latest('follows.created_at')
            ->paginate(20);

        return response()->json([
            'followers' => UserResource::collection($followers),
            'meta'      => [
                'current_page' => $followers->currentPage(),
                'last_page'    => $followers->lastPage(),
                'total'        => $followers->total(),
            ],
        ]);
    }

    /**
     * List users that a user is following.
     *
     * GET /api/users/{username}/following
     *
     * @param  Request  $request
     * @param  string   $username
     * @return JsonResponse
     */
    public function following(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();

        $following = $user->following()
            ->latest('follows.created_at')
            ->paginate(20);

        return response()->json([
            'following' => UserResource::collection($following),
            'meta'      => [
                'current_page' => $following->currentPage(),
                'last_page'    => $following->lastPage(),
                'total'        => $following->total(),
            ],
        ]);
    }
}
