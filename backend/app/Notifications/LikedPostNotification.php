<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use App\Notifications\Channels\ExpoPushChannel;
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
     * Store in-app notifications and send push notifications to registered devices.
     */
    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
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

    public function toExpoPush(object $notifiable): array
    {
        return [
            'title' => 'New like',
            'body' => "{$this->liker->username} liked your post.",
            'data' => $this->toDatabase($notifiable),
        ];
    }
}
