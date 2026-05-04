<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
            $table->string('post_type', 20)->default('media')->after('user_id');
            $table->json('poll_options')->nullable()->after('caption');
            $table->timestamp('poll_expires_at')->nullable()->after('poll_options');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['post_type', 'poll_options', 'poll_expires_at']);
            $table->string('image')->nullable(false)->change();
        });
    }
};
