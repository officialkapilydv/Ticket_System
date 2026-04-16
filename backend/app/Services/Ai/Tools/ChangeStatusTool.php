<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;

class ChangeStatusTool extends BaseTool
{
    public string $name = 'change_ticket_status';

    public function definition(): array
    {
        return [
            'name'         => 'change_ticket_status',
            'description'  => 'Changes the status of a ticket. Valid statuses: open, in_progress, in_review, resolved, closed.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket.',
                    ],
                    'status' => [
                        'type'        => 'string',
                        'enum'        => ['open', 'in_progress', 'in_review', 'resolved', 'closed'],
                        'description' => 'The new status.',
                    ],
                ],
                'required' => ['ticket_ulid', 'status'],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        $ticket = Ticket::where('ulid', $input['ticket_ulid'])->first();

        if (! $ticket) {
            return ['success' => false, 'error' => "Ticket {$input['ticket_ulid']} not found."];
        }

        // Non-admin agents can only change status on tickets they are assigned to
        if (! $user->isAdmin()) {
            $isAssigned = $ticket->assignees()->where('users.id', $user->id)->exists();
            $isReporter = $ticket->reporter_id === $user->id;

            if (! $isAssigned && ! $isReporter) {
                return ['success' => false, 'error' => 'You are not authorized to change the status of this ticket.'];
            }
        }

        try {
            $ticket = app(TicketService::class)->changeStatus($ticket, $input['status'], $user);

            return [
                'success'     => true,
                'ticket_ulid' => $ticket->ulid,
                'new_status'  => $ticket->status->value,
                'url'         => "/tickets/{$ticket->ulid}",
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
