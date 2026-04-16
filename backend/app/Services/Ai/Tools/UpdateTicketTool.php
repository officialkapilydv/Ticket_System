<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;

class UpdateTicketTool extends BaseTool
{
    public string $name = 'update_ticket';

    public function definition(): array
    {
        return [
            'name'         => 'update_ticket',
            'description'  => 'Updates fields on an existing ticket. Only provide the fields that need to change.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket to update.',
                    ],
                    'title' => [
                        'type'        => 'string',
                        'description' => 'New title.',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'New description.',
                    ],
                    'priority' => [
                        'type'        => 'string',
                        'enum'        => ['low', 'medium', 'high', 'critical'],
                        'description' => 'New priority.',
                    ],
                    'due_date' => [
                        'type'        => 'string',
                        'description' => 'New due date in YYYY-MM-DD format.',
                    ],
                    'assignee_ids' => [
                        'type'        => 'array',
                        'items'       => ['type' => 'integer'],
                        'description' => 'Replace all assignees with these user IDs.',
                    ],
                    'category_id' => [
                        'type'        => 'integer',
                        'description' => 'New category ID.',
                    ],
                    'estimated_hours' => [
                        'type'        => 'number',
                        'description' => 'New estimated hours.',
                    ],
                ],
                'required' => ['ticket_ulid'],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        $ticket = Ticket::where('ulid', $input['ticket_ulid'])->first();

        if (! $ticket) {
            return ['success' => false, 'error' => "Ticket {$input['ticket_ulid']} not found."];
        }

        // Agents can only edit tickets they reported or are assigned to (admins can edit all)
        if (! $user->isAdmin()) {
            $isAssigned = $ticket->assignees()->where('users.id', $user->id)->exists();
            $isReporter = $ticket->reporter_id === $user->id;

            if (! $isAssigned && ! $isReporter) {
                return ['success' => false, 'error' => 'You are not authorized to update this ticket.'];
            }
        }

        try {
            $data = array_filter(
                $input,
                fn ($key) => $key !== 'ticket_ulid',
                ARRAY_FILTER_USE_KEY
            );

            $ticket = app(TicketService::class)->update($ticket, $data, $user);

            return [
                'success'     => true,
                'ticket_ulid' => $ticket->ulid,
                'title'       => $ticket->title,
                'url'         => "/tickets/{$ticket->ulid}",
                'updated'     => array_keys($data),
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
