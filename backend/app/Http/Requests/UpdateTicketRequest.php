<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'status'          => ['sometimes', new Enum(TicketStatus::class)],
            'priority'        => ['sometimes', new Enum(TicketPriority::class)],
            'label_id'        => ['sometimes', 'nullable', 'exists:labels,id'],
            'category_id'     => ['nullable', 'exists:categories,id'],
            'assignee_id'     => ['nullable', 'exists:users,id'],
            'due_date'        => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
