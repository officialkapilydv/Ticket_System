<?php

namespace App\Http\Requests;

use App\Enums\TicketLabel;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->label === '') {
            $this->merge(['label' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'priority'         => ['required', new Enum(TicketPriority::class)],
            'label'            => ['nullable', new Enum(TicketLabel::class)],
            'category_id'      => ['nullable', 'exists:categories,id'],
            'assignee_id'      => ['nullable', 'exists:users,id'],
            'due_date'         => ['nullable', 'date', 'after_or_equal:today'],
            'estimated_hours'  => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
