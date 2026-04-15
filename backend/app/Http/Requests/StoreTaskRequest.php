<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'priority'        => ['required', new Enum(TicketPriority::class)],
            'label_id'        => ['nullable', 'exists:labels,id'],
            'category_id'     => ['nullable', 'exists:categories,id'],
            'assignee_ids'    => ['nullable', 'array'],
            'assignee_ids.*'  => ['exists:users,id'],
            'project_id'      => ['nullable', 'exists:projects,id'],
            'milestone_id'    => ['nullable', 'exists:milestones,id'],
            'due_date'        => ['nullable', 'date', 'after_or_equal:today'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
