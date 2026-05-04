<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $authUser = $request->user();

        return [
            'id' => $this->id,
            'media_url' => $this->media_url,
            'media_type' => $this->media_type ?: 'image',
            'caption' => $this->caption,
            'user' => new UserResource($this->whenLoaded('user')),
            'viewed' => $authUser
                ? $this->views()->where('user_id', $authUser->id)->exists()
                : false,
            'views_count' => $this->views()->count(),
            'is_owner' => $authUser
                ? $authUser->id === $this->user_id
                : false,
            'expires_at' => $this->expires_at->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
