<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource
 *
 * Transforms the User model into a clean API response.
 * Adapts output based on whether viewing own profile or someone else's.
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $authUser = $request->user();

        return [
            'id'              => $this->id,
            'username'        => $this->username,
            'full_name'       => $this->full_name,
            'email'           => $this->when(
                // Only expose email to the account owner
                $authUser && $authUser->id === $this->id,
                $this->email
            ),
            'bio'             => $this->bio,
            'avatar_url'      => $this->avatar_url, // computed accessor
            'cover_photo_url' => $this->cover_photo_url,
            'has_active_story' => $this->stories()
                ->where('expires_at', '>', now())
                ->exists(),
            'followers_count' => $this->followers()->count(),
            'following_count' => $this->following()->count(),
            'posts_count'     => $this->posts()->count(),
            // Is the authenticated user following this profile?
            'is_following'    => $authUser
                ? $authUser->isFollowing($this->resource)
                : false,
            'created_at'      => $this->created_at->toIso8601String(),
        ];
    }
}
