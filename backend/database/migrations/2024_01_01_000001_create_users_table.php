<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create users table
 *
 * Core user table with authentication fields and profile data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Authentication fields
            $table->string('username', 30)->unique(); // e.g. @johndoe
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Profile fields
            $table->string('full_name')->nullable();
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable(); // stored path in /storage/app/public/avatars/

            $table->rememberToken();
            $table->timestamps();

            // Index for fast username lookups (search)
            $table->index('username');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
