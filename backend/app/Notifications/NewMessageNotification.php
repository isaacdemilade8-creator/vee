<?php

namespace App\Notifications;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly User $sender,
        public readonly Conversation $conversation,
        public readonly Message $message
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'message',
            'sender_id' => $this->sender->id,
            'sender_username' => $this->sender->username,
            'sender_avatar' => $this->sender->avatar_url,
            'conversation_id' => $this->conversation->id,
            'message_id' => $this->message->id,
            'message_body' => $this->message->body,
            'message' => "{$this->sender->username} sent you a message.",
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        return [
            'title' => $this->sender->username,
            'body' => $this->message->body,
            'data' => $this->toDatabase($notifiable),
        ];
    }
}
