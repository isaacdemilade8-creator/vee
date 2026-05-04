<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Like Model
 *
 * Represents a user's like on a post.
 * Uses a unique constraint on (user_id, post_id) to prevent duplicate likes.
 */
class Like extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'post_id',
    ];

    // ─────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────

    /**
     * The user who gave this like.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The post this like belongs to.
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
