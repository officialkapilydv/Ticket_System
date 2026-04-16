<?php

namespace App\Services\Ai\Tools;

use App\Models\User;
use App\Services\TicketService;

class CreateTicketTool extends BaseTool
{
    public string $name = 'create_ticket';

    public function definition(): array
    {
        return [
            'name'         => 'create_ticket',
            'description'  => 'Creates a new support ticket. Use this when the user asks to create, open, or report a ticket.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'title'       => [
                        'type'        => 'string',
                        'description' => 'Short, descriptive ticket title.',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'Detailed description of the issue or request.',
                    ],
                    'priority' => [
                        'type'        => 'string',
                        'enum'        => ['low', 'medium', 'high', 'critical'],
                        'description' => 'Ticket priority. Default to medium if not specified.',
                    ],
                    'assignee_ids' => [
                        'type'        => 'array',
                        'items'       => ['type' => 'integer'],
                        'description' => 'Array of user IDs to assign the ticket to.',
                    ],
                    'due_date' => [
                        'type'        => 'string',
                        'description' => 'Due date in YYYY-MM-DD format.',
                    ],
                    'category_id' => [
                        'type'        => 'integer',
                        'description' => 'Category ID for the ticket.',
                    ],
                    'project_id' => [
                        'type'        => 'integer',
                        'description' => 'Project ID to attach the ticket to.',
                    ],
                    'estimated_hours' => [
                        'type'        => 'number',
                        'description' => 'Estimated hours to complete.',
                    ],
                ],
                'required' => ['title'],
            ],
        ];
    }

    public function execute(array $input, User $user): array
    {
        try {
            $ticket = app(TicketService::class)->create($input, $user);

            return [
                'success'     => true,
                'ticket_ulid' => $ticket->ulid,
                'ticket_id'   => $ticket->id,
                'title'       => $ticket->title,
                'status'      => $ticket->status->value,
                'priority'    => $ticket->priority->value,
                'url'         => "/tickets/{$ticket->ulid}",
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
