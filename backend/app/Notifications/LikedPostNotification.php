<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * LikedPostNotification
 *
 * Fired when a user likes someone else's post.
 * Stored in the `notifications` database table.
 */
class LikedPostNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $liker,
        public readonly Post $post
    ) {}

    /**
     * Deliver only via database channel for now.
     * Can add 'mail', 'broadcast', or push channels later.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Data stored in the notifications table.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type'        => 'like',
            'liker_id'    => $this->liker->id,
            'liker_username' => $this->liker->username,
            'liker_avatar'   => $this->liker->avatar_url,
            'post_id'     => $this->post->id,
            'post_image'  => $this->post->image_url,
            'message'     => "{$this->liker->username} liked your post.",
        ];
    }
}
