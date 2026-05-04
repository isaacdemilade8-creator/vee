<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DatabaseSeeder
 *
 * Seeds the database with sample data for development and testing.
 * Run with: php artisan db:seed
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Create 5 sample users ──────────────────────────────────────────────

        $alice = User::create([
            'username'  => 'alice',
            'email'     => 'alice@example.com',
            'password'  => Hash::make('password'),
            'full_name' => 'Alice Johnson',
            'bio'       => 'Photographer & world traveler 🌍',
        ]);

        $bob = User::create([
            'username'  => 'bob',
            'email'     => 'bob@example.com',
            'password'  => Hash::make('password'),
            'full_name' => 'Bob Smith',
            'bio'       => 'Coffee enthusiast ☕ | Developer',
        ]);

        $carol = User::create([
            'username'  => 'carol',
            'email'     => 'carol@example.com',
            'password'  => Hash::make('password'),
            'full_name' => 'Carol Williams',
            'bio'       => 'Food lover 🍕 | Home chef',
        ]);

        // ── Set up follow relationships ────────────────────────────────────────

        $alice->following()->attach($bob->id);
        $alice->following()->attach($carol->id);
        $bob->following()->attach($alice->id);

        // ── Create sample posts (image paths are placeholders) ────────────────

        $post1 = Post::create([
            'user_id' => $alice->id,
            'image'   => 'posts/sample1.jpg', // placeholder path
            'caption' => 'Beautiful sunset from my balcony 🌅 #photography #nature',
        ]);

        $post2 = Post::create([
            'user_id' => $bob->id,
            'image'   => 'posts/sample2.jpg',
            'caption' => 'Morning coffee is the best ☕ #coffee #morning',
        ]);

        $post3 = Post::create([
            'user_id' => $carol->id,
            'image'   => 'posts/sample3.jpg',
            'caption' => 'Homemade pasta from scratch 🍝 #cooking #food',
        ]);

        // ── Add some likes ────────────────────────────────────────────────────

        Like::create(['user_id' => $bob->id,   'post_id' => $post1->id]);
        Like::create(['user_id' => $carol->id, 'post_id' => $post1->id]);
        Like::create(['user_id' => $alice->id, 'post_id' => $post2->id]);

        // ── Add some comments ─────────────────────────────────────────────────

        Comment::create([
            'user_id' => $bob->id,
            'post_id' => $post1->id,
            'body'    => 'Stunning shot! 😍',
        ]);

        Comment::create([
            'user_id' => $carol->id,
            'post_id' => $post1->id,
            'body'    => 'Wow, what a view! 🌟',
        ]);

        Comment::create([
            'user_id' => $alice->id,
            'post_id' => $post2->id,
            'body'    => 'Coffee goals! ☕',
        ]);

        $this->command->info('✅ Sample data seeded successfully!');
        $this->command->info('   Login: alice@example.com / password');
        $this->command->info('   Login: bob@example.com / password');
    }
}
