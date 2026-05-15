<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * PostResource
 *
 * Transforms the Post model into a structured API response.
 * Includes author info, image URL, counts, and interaction state.
 */
class PostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $authUser = $request->user();

        return [
            'id'             => $this->id,
            'post_type'      => $this->post_type ?: 'media',
            'image_url'      => $this->image_url, // backwards compatible media URL
            'media_url'      => $this->media_url,
            'media_type'     => $this->media_type ?: ($this->post_type ?: 'image'),
            'caption'        => $this->caption,
            'poll_options'   => $this->poll_options,
            'poll_expires_at' => $this->poll_expires_at?->toIso8601String(),
            'poll_results'   => $this->poll_options ? $this->pollResults() : null,
            'user_poll_vote' => $authUser && $this->poll_options
                ? $this->pollVotes()->where('user_id', $authUser->id)->value('option_index')
                : null,

            // Author information (eager-loaded via ->with('user'))
            'user'           => new UserResource($this->whenLoaded('user')),

            // Counts
            'likes_count'    => $this->likes()->count(),
            'comments_count' => $this->comments()->count(),
            'shares_count'   => $this->shares()->count(),
            'reposts_count'  => $this->reposts()->count(),
            'views_count'    => $this->views()->where('user_id', '!=', $this->user_id)->count(),

            // Has the authenticated user liked this post?
            'is_liked'       => $authUser
                ? $this->isLikedBy($authUser)
                : false,
            'is_reposted'    => $authUser
                ? $this->isRepostedBy($authUser)
                : false,
            'is_viewed'      => $authUser
                ? $this->views()->where('user_id', $authUser->id)->exists()
                : false,
            'hashtags'       => $this->whenLoaded('hashtags', fn() => $this->hashtags->map(fn($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'category' => $tag->category,
            ])->values()),

            // Latest 3 comments for feed preview
            'recent_comments' => CommentResource::collection(
                $this->whenLoaded('comments', fn() => $this->comments->take(3))
            ),

            // Is this post owned by the authenticated user?
            'is_owner' => $authUser
                ? $authUser->id === $this->user_id
                : false,

            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }

    private function pollResults(): array
    {
        $counts = $this->pollVotes()
            ->selectRaw('option_index, count(*) as votes')
            ->groupBy('option_index')
            ->pluck('votes', 'option_index');
        $total = (int) $counts->sum();

        return collect($this->poll_options)->map(function ($option, $index) use ($counts, $total) {
            $votes = (int) ($counts[$index] ?? 0);

            return [
                'option' => $option,
                'votes' => $votes,
                'percentage' => $total > 0 ? round(($votes / $total) * 100) : 0,
            ];
        })->values()->all();
    }
}
