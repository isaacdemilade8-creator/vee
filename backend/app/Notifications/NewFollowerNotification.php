<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * NewFollowerNotification
 *
 * Fired when a user gains a new follower.
 */
class NewFollowerNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $follower
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'              => 'follow',
            'follower_id'       => $this->follower->id,
            'follower_username' => $this->follower->username,
            'follower_avatar'   => $this->follower->avatar_url,
            'message'           => "{$this->follower->username} started following you.",
        ];
    }
}
