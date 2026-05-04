<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $otherUser = $request->user() ? $this->otherUser($request->user()) : null;

        return [
            'id' => $this->id,
            'other_user' => $otherUser ? new UserResource($otherUser) : null,
            'latest_message' => $this->whenLoaded('latestMessage', fn() => $this->latestMessage ? new MessageResource($this->latestMessage) : null),
            'unread_count' => $request->user()
                ? $this->messages()
                    ->where('sender_id', '!=', $request->user()->id)
                    ->whereNull('read_at')
                    ->count()
                : 0,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
