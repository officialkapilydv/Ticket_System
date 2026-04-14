<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body'          => ['nullable', 'string', 'max:10000'],
            'parent_id'     => ['nullable', 'exists:ticket_comments,id'],
            'is_internal'   => ['boolean'],
            'files'         => ['nullable', 'array', 'max:10'],
            'files.*'       => ['file', 'max:20480'], // 20 MB per file
        ];
    }
}
