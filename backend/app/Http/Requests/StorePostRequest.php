<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StorePostRequest
 *
 * Validates incoming post creation data.
 * Rich posts can be text, media, audio, or poll.
 */
class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'post_type' => [
                'nullable',
                'string',
                'in:text,media,image,video,audio,poll',
            ],
            'media'   => [
                'nullable',
                'required_if:post_type,media,image,video,audio',
                'file',
                'max:' . config('app.max_media_size_kb', config('app.max_image_size_kb', 5120)),
            ],
            'caption' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'poll_options' => [
                'nullable',
                'array',
                'required_if:post_type,poll',
                'min:2',
                'max:6',
            ],
            'poll_options.*' => [
                'required',
                'string',
                'max:120',
            ],
            'poll_expires_hours' => [
                'nullable',
                'integer',
                'min:1',
                'max:168',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->hasFile('media') && $this->hasFile('image')) {
            $this->files->set('media', $this->file('image'));
        }

        if (is_string($this->poll_options)) {
            $decoded = json_decode($this->poll_options, true);
            if (is_array($decoded)) {
                $this->merge(['poll_options' => $decoded]);
            }
        }

        if (!$this->post_type) {
            $this->merge(['post_type' => $this->hasFile('media') ? 'media' : 'text']);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('post_type', 'text');
            $hasText = trim((string) $this->input('caption', '')) !== '';
            $file = $this->file('media');

            if (in_array($type, ['text', 'poll'], true) && !$hasText) {
                $validator->errors()->add('caption', 'Text is required for this post type.');
            }

            if ($file && $file->isValid()) {
                $mimeType = (string) $file->getMimeType();
                $isAllowed = str_starts_with($mimeType, 'image/')
                    || str_starts_with($mimeType, 'video/')
                    || str_starts_with($mimeType, 'audio/');

                if (!$isAllowed) {
                    $validator->errors()->add('media', "Unsupported media type: {$mimeType}.");
                }
            }
        });
    }
}
