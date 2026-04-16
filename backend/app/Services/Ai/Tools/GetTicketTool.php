<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;

class GetTicketTool extends BaseTool
{
    public string $name = 'get_ticket';

    public function definition(): array
    {
        return [
            'name'         => 'get_ticket',
            'description'  => 'Fetches full details of a specific ticket by its ULID. Use this when the user asks to view or describe a specific ticket.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket to retrieve.',
                    ],
                ],
                'required' => ['ticket_ulid'],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        $ticket = Ticket::with([
            'reporter:id,name',
            'assignees:users.id,users.name',
            'category:id,name',
        ])->where('ulid', $input['ticket_ulid'])->first();

        if (! $ticket) {
            return ['success' => false, 'error' => "Ticket {$input['ticket_ulid']} not found."];
        }

        return [
            'success'         => true,
            'ulid'            => $ticket->ulid,
            'title'           => $ticket->title,
            'description'     => $ticket->description,
            'status'          => $ticket->status->value,
            'priority'        => $ticket->priority->value,
            'reporter'        => $ticket->reporter?->name,
            'assignees'       => $ticket->assignees->pluck('name')->implode(', '),
            'category'        => $ticket->category?->name,
            'due_date'        => $ticket->due_date?->toDateString(),
            'estimated_hours' => $ticket->estimated_hours,
            'created_at'      => $ticket->created_at->toDateString(),
            'is_overdue'      => $ticket->isOverdue(),
            'url'             => "/tickets/{$ticket->ulid}",
        ];
    }
}
