<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create posts table
 *
 * Each post belongs to a user and contains an image path and optional caption.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Post content
            $table->string('image'); // stored path in /storage/app/public/posts/
            $table->text('caption')->nullable();

            $table->timestamps();

            // Index for fast feed queries (user posts ordered by date)
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
