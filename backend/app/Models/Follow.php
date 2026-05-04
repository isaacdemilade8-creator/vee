<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Follow Model
 *
 * Pivot model representing a follow relationship between two users.
 * follower_id → follows → following_id
 */
class Follow extends Model
{
    use HasFactory;

    protected $table = 'follows';

    protected $fillable = [
        'follower_id',
        'following_id',
    ];

    // ─────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────

    /**
     * The user doing the following.
     */
    public function follower()
    {
        return $this->belongsTo(User::class, 'follower_id');
    }

    /**
     * The user being followed.
     */
    public function following()
    {
        return $this->belongsTo(User::class, 'following_id');
    }
}
