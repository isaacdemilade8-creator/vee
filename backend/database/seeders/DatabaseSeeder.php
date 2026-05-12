<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $alice = User::updateOrCreate(
            ['email' => 'alice@example.com'],
            [
                'username' => 'alice',
                'password' => Hash::make('password'),
                'full_name' => 'Alice Johnson',
                'bio' => 'Photographer and world traveler',
            ]
        );

        $bob = User::updateOrCreate(
            ['email' => 'bob@example.com'],
            [
                'username' => 'bob',
                'password' => Hash::make('password'),
                'full_name' => 'Bob Smith',
                'bio' => 'Coffee enthusiast and developer',
            ]
        );

        $carol = User::updateOrCreate(
            ['email' => 'carol@example.com'],
            [
                'username' => 'carol',
                'password' => Hash::make('password'),
                'full_name' => 'Carol Williams',
                'bio' => 'Food lover and home chef',
            ]
        );

        $alice->following()->syncWithoutDetaching([$bob->id, $carol->id]);
        $bob->following()->syncWithoutDetaching([$alice->id]);

        $post1 = Post::updateOrCreate(
            ['user_id' => $alice->id, 'image' => 'posts/sample1.jpg'],
            ['caption' => 'Beautiful sunset from my balcony #photography #nature']
        );

        $post2 = Post::updateOrCreate(
            ['user_id' => $bob->id, 'image' => 'posts/sample2.jpg'],
            ['caption' => 'Morning coffee is the best #coffee #morning']
        );

        $post3 = Post::updateOrCreate(
            ['user_id' => $carol->id, 'image' => 'posts/sample3.jpg'],
            ['caption' => 'Homemade pasta from scratch #cooking #food']
        );

        foreach (
            [
                [$bob->id, $post1->id],
                [$carol->id, $post1->id],
                [$alice->id, $post2->id],
            ] as [$userId, $postId]
        ) {
            Like::firstOrCreate(['user_id' => $userId, 'post_id' => $postId]);
        }

        Comment::firstOrCreate(
            ['user_id' => $bob->id, 'post_id' => $post1->id, 'body' => 'Stunning shot!']
        );

        Comment::firstOrCreate(
            ['user_id' => $carol->id, 'post_id' => $post1->id, 'body' => 'Wow, what a view!']
        );

        Comment::firstOrCreate(
            ['user_id' => $alice->id, 'post_id' => $post2->id, 'body' => 'Coffee goals!']
        );

        $this->command->info('Sample data is ready.');
        $this->command->info('Login: alice@example.com / password');
        $this->command->info('Login: bob@example.com / password');
        $this->command->info('Login: carol@example.com / password');
    }
}
