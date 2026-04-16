<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;

class SearchTicketsTool extends BaseTool
{
    public string $name = 'search_tickets';

    public function definition(): array
    {
        return [
            'name'         => 'search_tickets',
            'description'  => 'Search for tickets by title, status, priority, or assignee. Use this to find a ticket before acting on it.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'query' => [
                        'type'        => 'string',
                        'description' => 'Search term to match against ticket title.',
                    ],
                    'status' => [
                        'type'        => 'string',
                        'enum'        => ['open', 'in_progress', 'in_review', 'resolved', 'closed'],
                        'description' => 'Filter by status.',
                    ],
                    'priority' => [
                        'type'        => 'string',
                        'enum'        => ['low', 'medium', 'high', 'critical'],
                        'description' => 'Filter by priority.',
                    ],
                    'assignee_id' => [
                        'type'        => 'integer',
                        'description' => 'Filter by assignee user ID.',
                    ],
                    'limit' => [
                        'type'        => 'integer',
                        'description' => 'Max results to return. Default 5.',
                    ],
                ],
                'required' => [],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        $query = Ticket::with(['reporter:id,name', 'assignees:users.id,users.name'])
            ->orderByDesc('created_at')
            ->limit($input['limit'] ?? 5);

        if (! empty($input['query'])) {
            $query->where('title', 'like', '%' . $input['query'] . '%');
        }

        if (! empty($input['status'])) {
            $query->where('status', $input['status']);
        }

        if (! empty($input['priority'])) {
            $query->where('priority', $input['priority']);
        }

        if (! empty($input['assignee_id'])) {
            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $input['assignee_id']));
        }

        $tickets = $query->get();

        if ($tickets->isEmpty()) {
            return ['success' => true, 'tickets' => [], 'message' => 'No tickets found matching your criteria.'];
        }

        return [
            'success' => true,
            'tickets' => $tickets->map(fn ($t) => [
                'ulid'        => $t->ulid,
                'title'       => $t->title,
                'status'      => $t->status->value,
                'priority'    => $t->priority->value,
                'reporter'    => $t->reporter?->name,
                'assignees'   => $t->assignees->pluck('name')->implode(', '),
                'due_date'    => $t->due_date?->toDateString(),
                'url'         => "/tickets/{$t->ulid}",
            ])->values()->toArray(),
        ];
    }
}
