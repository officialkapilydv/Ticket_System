<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TimeLogService;

class LogTimeTool extends BaseTool
{
    public string $name = 'log_time';

    public function definition(): array
    {
        return [
            'name'         => 'log_time',
            'description'  => 'Logs time spent on a ticket for the current user.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket to log time on.',
                    ],
                    'minutes' => [
                        'type'        => 'integer',
                        'description' => 'Number of minutes to log. If user says "2 hours", convert to 120.',
                    ],
                    'logged_date' => [
                        'type'        => 'string',
                        'description' => 'Date the work was done, in YYYY-MM-DD format. Default to today.',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'Optional description of work done.',
                    ],
                ],
                'required' => ['ticket_ulid', 'minutes', 'logged_date'],
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
            $timeLog = app(TimeLogService::class)->log(
                $ticket,
                [
                    'minutes'     => $input['minutes'],
                    'logged_date' => $input['logged_date'],
                    'description' => $input['description'] ?? null,
                ],
                $user
            );

            $hours = round($input['minutes'] / 60, 1);

            return [
                'success'     => true,
                'time_log_id' => $timeLog->id,
                'ticket_ulid' => $ticket->ulid,
                'minutes'     => $input['minutes'],
                'hours'       => $hours,
                'logged_date' => $input['logged_date'],
                'url'         => "/tickets/{$ticket->ulid}",
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
