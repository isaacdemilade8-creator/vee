<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Post Model
 *
 * Represents a photo post with caption, image, and social interactions.
 */
class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'post_type',
        'image',
        'media_type',
        'caption',
        'poll_options',
        'poll_expires_at',
    ];

    protected $casts = [
        'poll_options' => 'array',
        'poll_expires_at' => 'datetime',
    ];

    // ─────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────

    /**
     * The user who created this post.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Likes on this post.
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Comments on this post.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function reposts()
    {
        return $this->hasMany(Repost::class);
    }

    public function shares()
    {
        return $this->hasMany(PostShare::class);
    }

    public function views()
    {
        return $this->hasMany(PostView::class);
    }

    public function hashtags()
    {
        return $this->belongsToMany(Hashtag::class)->withTimestamps();
    }

    public function pollVotes()
    {
        return $this->hasMany(PollVote::class);
    }

    // ─────────────────────────────────────────
    // ACCESSORS
    // ─────────────────────────────────────────

    /**
     * Get the full public URL for the post image.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        return url('/api/media') . '?path=' . rawurlencode($this->image);
    }

    public function getMediaUrlAttribute(): ?string
    {
        return $this->image_url;
    }

    /**
     * Get the total like count for this post.
     */
    public function getLikesCountAttribute(): int
    {
        return $this->likes()->count();
    }

    /**
     * Get the total comment count for this post.
     */
    public function getCommentsCountAttribute(): int
    {
        return $this->comments()->count();
    }

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────

    /**
     * Check if a specific user has liked this post.
     */
    public function isLikedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }

    public function isRepostedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->reposts()->where('user_id', $user->id)->exists();
    }
}
