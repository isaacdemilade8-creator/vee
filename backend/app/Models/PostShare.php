<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostShare extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'post_id', 'channel'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
