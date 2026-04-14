<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimeLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logged_date' => ['required', 'date', 'before_or_equal:today'],
            'minutes'     => ['required', 'integer', 'min:1', 'max:1440'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
