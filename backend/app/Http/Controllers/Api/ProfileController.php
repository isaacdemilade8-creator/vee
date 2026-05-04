<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * ProfileController
 *
 * Handles viewing and editing user profiles.
 */
class ProfileController extends Controller
{
    /**
     * View a user profile by username.
     *
     * GET /api/users/{username}
     *
     * @param  Request  $request
     * @param  string   $username
     * @return JsonResponse
     */
    public function show(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Get the authenticated user's own profile.
     *
     * GET /api/profile
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function myProfile(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     *
     * POST /api/profile (using POST for multipart/form-data with image upload)
     *
     * @param  UpdateProfileRequest  $request
     * @return JsonResponse
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->only(['full_name', 'bio', 'username']);

        // Handle avatar image upload
        if ($request->hasFile('avatar')) {
            // Delete the old avatar to save storage space
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Store the new avatar in /storage/app/public/avatars/
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        if ($request->hasFile('cover_photo')) {
            if ($user->cover_photo) {
                Storage::disk('public')->delete($user->cover_photo);
            }

            $path = $request->file('cover_photo')->store('covers', 'public');
            $data['cover_photo'] = $path;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Get posts by a specific user (their profile grid).
     *
     * GET /api/users/{username}/posts
     *
     * @param  Request  $request
     * @param  string   $username
     * @return JsonResponse
     */
    public function userPosts(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();

        $posts = $user->posts()
            ->with(['user', 'comments.user', 'hashtags'])
            ->latest()
            ->paginate(12); // 12 per page for a 3-column grid

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta'  => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'per_page'     => $posts->perPage(),
            ],
        ]);
    }

    public function userReposts(Request $request, string $username): JsonResponse
    {
        $user = User::where('username', strtolower($username))->firstOrFail();

        $posts = $user->reposts()
            ->with(['post.user', 'post.comments.user', 'post.hashtags'])
            ->latest()
            ->paginate(12)
            ->through(fn($repost) => $repost->post);

        return response()->json([
            'posts' => PostResource::collection($posts),
            'meta'  => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'per_page'     => $posts->perPage(),
            ],
        ]);
    }

    /**
     * Search users by username or full name.
     *
     * GET /api/users/search?q={query}
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['users' => []]);
        }

        $users = User::where('username', 'LIKE', "%{$query}%")
            ->orWhere('full_name', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get();

        return response()->json([
            'users' => UserResource::collection($users),
        ]);
    }
}
