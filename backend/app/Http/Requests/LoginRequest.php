<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * LoginRequest
 *
 * Validates login credentials.
 * Accepts either email or username (handled in controller).
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Accept login via email field (can be email or username string)
            'email'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }
}
