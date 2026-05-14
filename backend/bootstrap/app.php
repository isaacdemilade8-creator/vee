<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API clients authenticate with Sanctum bearer tokens, so keep API
        // requests stateless and avoid requiring a database-backed session.
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->web(remove: [
            StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        /*
         | Return JSON error responses for all API routes
         | instead of HTML pages or redirects.
         */

        // Validation errors → 422 JSON
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return new JsonResponse([
                    'message' => 'Validation failed.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        // Model not found → 404 JSON
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return new JsonResponse([
                    'message' => 'Resource not found.',
                ], 404);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return new JsonResponse([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        // Generic API error fallback
        $exceptions->render(function (\Exception $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $status = method_exists($e, 'getStatusCode')
                    ? $e->getStatusCode()
                    : 500;

                return new JsonResponse([
                    'message' => $e->getMessage() ?: 'An unexpected error occurred.',
                ], $status);
            }
        });
    })
    ->create();
