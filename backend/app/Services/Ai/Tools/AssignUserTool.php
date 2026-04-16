<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;

class AssignUserTool extends BaseTool
{
    public string $name = 'assign_user';

    public function definition(): array
    {
        return [
            'name'         => 'assign_user',
            'description'  => 'Assigns or reassigns users to a ticket. Replaces the existing assignee list.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket.',
                    ],
                    'assignee_ids' => [
                        'type'        => 'array',
                        'items'       => ['type' => 'integer'],
                        'description' => 'Array of user IDs to assign. Pass empty array to unassign all.',
                    ],
                ],
                'required' => ['ticket_ulid', 'assignee_ids'],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        $ticket = Ticket::where('ulid', $input['ticket_ulid'])->first();

        if (! $ticket) {
            return ['success' => false, 'error' => "Ticket {$input['ticket_ulid']} not found."];
        }

        try {
            $ticket = app(TicketService::class)->assign($ticket, $input['assignee_ids'], $user);

            $assigneeNames = $ticket->assignees->pluck('name')->implode(', ');

            return [
                'success'      => true,
                'ticket_ulid'  => $ticket->ulid,
                'assignees'    => $assigneeNames ?: 'Unassigned',
                'assignee_ids' => $input['assignee_ids'],
                'url'          => "/tickets/{$ticket->ulid}",
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
