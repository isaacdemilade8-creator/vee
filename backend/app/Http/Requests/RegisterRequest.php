<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * RegisterRequest
 *
 * Validates incoming registration data.
 * Username must be unique and slug-like (no spaces).
 */
class RegisterRequest extends FormRequest
{
    /**
     * All API requests are allowed (auth checked at route level).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for registration.
     */
    public function rules(): array
    {
        return [
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'unique:users,username',
                // Only letters, numbers, underscores, dots
                'regex:/^[a-zA-Z0-9_.]+$/',
            ],
            'email'    => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed', // expects password_confirmation field
            ],
            'full_name' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    /**
     * Custom human-readable messages.
     */
    public function messages(): array
    {
        return [
            'username.regex'   => 'Username may only contain letters, numbers, underscores, and dots.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
