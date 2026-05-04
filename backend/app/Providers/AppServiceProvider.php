<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

/**
 * AppServiceProvider
 *
 * Boot application-level services and bindings.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production so that storage URLs are correct
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
