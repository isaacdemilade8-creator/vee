<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_stream_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stream_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('body', 500);
            $table->timestamps();

            $table->index(['live_stream_id', 'created_at']);
        });

        Schema::create('live_stream_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stream_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 24)->default('like');
            $table->timestamps();

            $table->index(['live_stream_id', 'type']);
        });

        Schema::create('live_stream_viewers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stream_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['live_stream_id', 'user_id']);
            $table->index(['live_stream_id', 'last_seen_at']);
        });

        Schema::create('live_stream_cohost_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stream_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 24)->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['live_stream_id', 'user_id']);
            $table->index(['live_stream_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stream_cohost_requests');
        Schema::dropIfExists('live_stream_viewers');
        Schema::dropIfExists('live_stream_reactions');
        Schema::dropIfExists('live_stream_comments');
    }
};
