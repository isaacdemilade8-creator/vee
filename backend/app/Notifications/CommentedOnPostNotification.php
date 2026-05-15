<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * CommentedOnPostNotification
 *
 * Fired when a user comments on someone else's post.
 */
class CommentedOnPostNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User    $commenter,
        public readonly Post    $post,
        public readonly Comment $comment
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'               => 'comment',
            'commenter_id'       => $this->commenter->id,
            'commenter_username' => $this->commenter->username,
            'commenter_avatar'   => $this->commenter->avatar_url,
            'post_id'            => $this->post->id,
            'post_image'         => $this->post->image_url,
            'comment_id'         => $this->comment->id,
            'comment_body'       => $this->comment->body,
            'message'            => "{$this->commenter->username} commented: \"{$this->comment->body}\"",
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        return [
            'title' => 'New comment',
            'body' => "{$this->commenter->username}: {$this->comment->body}",
            'data' => $this->toDatabase($notifiable),
        ];
    }
}
