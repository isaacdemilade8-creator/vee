<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * AuthController
 *
 * Handles user registration, login, and logout.
 * Uses Laravel Sanctum for API token generation.
 */
class AuthController extends Controller
{
    /**
     * Register a new user account.
     *
     * POST /api/auth/register
     *
     * @param  RegisterRequest  $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'username'  => strtolower($request->username),
            'email'     => strtolower($request->email),
            'password'  => Hash::make($request->password),
            'full_name' => $request->full_name,
        ]);

        // Generate a Sanctum API token for immediate use after registration
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'user'    => new UserResource($user),
            'token'   => $token,
        ], 201);
    }

    /**
     * Authenticate an existing user and return a new token.
     *
     * POST /api/auth/login
     * Accepts email OR username in the "email" field.
     *
     * @param  LoginRequest  $request
     * @return JsonResponse
     * @throws ValidationException
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $loginValue = $request->email;

        // Determine whether input is an email or username
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($field, strtolower($loginValue))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke previous tokens to enforce single-session login (optional — remove to allow multi-device)
        // $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'user'    => new UserResource($user),
            'token'   => $token,
        ]);
    }

    /**
     * Revoke the current user's API token (logout).
     *
     * POST /api/auth/logout
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Delete only the current token, not all tokens (supports multi-device)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Return the currently authenticated user's data.
     *
     * GET /api/auth/me
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }
}
