<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InboxController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne', 'userTwo', 'latestMessage.sender'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'conversations' => ConversationResource::collection($conversations),
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
        ]);

        $recipient = User::where('username', $validated['username'])->firstOrFail();

        if ($recipient->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'username' => ['You cannot message yourself.'],
            ]);
        }

        $conversation = Conversation::between($request->user(), $recipient)
            ->load(['userOne', 'userTwo', 'latestMessage.sender']);

        return response()->json([
            'conversation' => new ConversationResource($conversation),
        ]);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = $conversation->messages()
            ->with('sender')
            ->latest()
            ->paginate(30);

        return response()->json([
            'messages' => MessageResource::collection($messages),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'has_more' => $messages->hasMorePages(),
            ],
        ]);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => trim($validated['body']),
        ]);

        $conversation->forceFill(['last_message_at' => $message->created_at])->save();

        return response()->json([
            'message' => new MessageResource($message->load('sender')),
        ], 201);
    }

    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        if (!in_array($request->user()->id, [$conversation->user_one_id, $conversation->user_two_id], true)) {
            abort(403, 'You are not a participant in this conversation.');
        }
    }
}
