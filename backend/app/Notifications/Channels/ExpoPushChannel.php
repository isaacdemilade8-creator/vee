<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class ExpoPushChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notifiable, 'pushTokens')) {
            return;
        }

        $tokens = $notifiable->pushTokens()
            ->where('enabled', true)
            ->pluck('token');

        if ($tokens->isEmpty()) {
            return;
        }

        $payload = method_exists($notification, 'toExpoPush')
            ? $notification->toExpoPush($notifiable)
            : $this->fallbackPayload($notification, $notifiable);

        $messages = $tokens
            ->filter(fn ($token) => Str::startsWith($token, 'ExponentPushToken[') || Str::startsWith($token, 'ExpoPushToken['))
            ->map(fn ($token) => array_merge([
                'to' => $token,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
            ], $payload))
            ->values();

        if ($messages->isEmpty()) {
            return;
        }

        $messages->chunk(100)->each(function ($chunk) use ($notifiable) {
            try {
                $response = Http::timeout(10)
                    ->acceptJson()
                    ->asJson()
                    ->post('https://exp.host/--/api/v2/push/send', $chunk->values()->all());
            } catch (Throwable) {
                return;
            }

            if (!$response->successful()) {
                return;
            }

            collect($response->json('data', []))->each(function ($ticket, $index) use ($chunk, $notifiable) {
                if (($ticket['details']['error'] ?? null) === 'DeviceNotRegistered') {
                    $notifiable->pushTokens()
                        ->where('token', $chunk->values()->get($index)['to'] ?? null)
                        ->update(['enabled' => false]);
                }
            });
        });
    }

    private function fallbackPayload(Notification $notification, object $notifiable): array
    {
        $data = method_exists($notification, 'toDatabase')
            ? $notification->toDatabase($notifiable)
            : [];

        return [
            'title' => config('app.name', 'Vee'),
            'body' => $data['message'] ?? 'You have a new notification.',
            'data' => $data,
        ];
    }
}
