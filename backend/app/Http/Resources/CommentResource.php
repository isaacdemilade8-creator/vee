<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * CommentResource
 *
 * Transforms Comment model into a clean API response.
 */
class CommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $authUser = $request->user();

        return [
            'id'         => $this->id,
            'body'       => $this->body,
            'user'       => new UserResource($this->whenLoaded('user')),
            // Allow the author or the post owner to delete
            'is_owner'   => $authUser
                ? $authUser->id === $this->user_id
                : false,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
