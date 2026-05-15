<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveStream extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'room_name',
        'status',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(LiveStreamComment::class);
    }

    public function reactions()
    {
        return $this->hasMany(LiveStreamReaction::class);
    }

    public function viewers()
    {
        return $this->hasMany(LiveStreamViewer::class);
    }

    public function cohostRequests()
    {
        return $this->hasMany(LiveStreamCohostRequest::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
