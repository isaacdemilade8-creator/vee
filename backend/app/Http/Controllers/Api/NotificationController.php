<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * NotificationController
 *
 * Retrieves in-app notifications and marks them as read.
 */
class NotificationController extends Controller
{
    /**
     * List all notifications for the authenticated user.
     *
     * GET /api/notifications
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->paginate(20);

        return response()->json([
            'notifications' => NotificationResource::collection($notifications),
            'unread_count'  => $request->user()->unreadNotifications()->count(),
            'meta'          => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
            ],
        ]);
    }

    /**
     * Mark all unread notifications as read.
     *
     * POST /api/notifications/read-all
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Mark a specific notification as read.
     *
     * POST /api/notifications/{id}/read
     *
     * @param  Request  $request
     * @param  string   $id
     * @return JsonResponse
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
        ]);
    }
}
