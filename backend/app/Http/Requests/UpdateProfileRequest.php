<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateProfileRequest
 *
 * Validates profile update data.
 * All fields are optional — users can update any subset.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is protected by auth:sanctum middleware
    }

    public function rules(): array
    {
        return [
            'full_name' => ['nullable', 'string', 'max:100'],
            'bio'       => ['nullable', 'string', 'max:500'],
            'avatar'    => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:' . config('app.max_image_size_kb', 5120), // 5MB default
            ],
            'cover_photo' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:' . config('app.max_image_size_kb', 5120),
            ],
            'username'  => [
                'nullable',
                'string',
                'min:3',
                'max:30',
                // Unique except for the current user
                'unique:users,username,' . $this->user()->id,
                'regex:/^[a-zA-Z0-9_.]+$/',
            ],
        ];
    }
}
