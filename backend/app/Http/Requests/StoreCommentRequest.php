<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'status'      => $this->status      ?: null,
            'priority'    => $this->priority    ?: null,
            'label_id'    => $this->label_id    ?: null,
            'category_id' => $this->category_id ?: null,
            'due_date'    => $this->due_date    ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            // Comment fields
            'body'          => ['nullable', 'string', 'max:10000'],
            'parent_id'     => ['nullable', 'exists:ticket_comments,id'],
            'is_internal'   => ['boolean'],
            'minutes'       => ['nullable', 'integer', 'min:1'],
            'logged_date'   => ['nullable', 'date'],
            'files'         => ['nullable', 'array', 'max:10'],
            'files.*'       => ['file', 'max:20480'],
            // Ticket update fields
            'status'        => ['nullable', Rule::enum(TicketStatus::class)],
            'priority'      => ['nullable', Rule::enum(TicketPriority::class)],
            'label_id'      => ['nullable', 'exists:labels,id'],
            'category_id'   => ['nullable', 'exists:categories,id'],
            'due_date'      => ['nullable', 'date'],
            'progress'      => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
