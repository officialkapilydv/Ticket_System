<?php

namespace App\Services\Ai\Tools;

use App\Models\Ticket;
use App\Models\User;
use App\Services\CommentService;

class AddCommentTool extends BaseTool
{
    public string $name = 'add_comment';

    public function definition(): array
    {
        return [
            'name'         => 'add_comment',
            'description'  => 'Adds a comment to a ticket on behalf of the user.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'ticket_ulid' => [
                        'type'        => 'string',
                        'description' => 'The ULID of the ticket to comment on.',
                    ],
                    'body' => [
                        'type'        => 'string',
                        'description' => 'The comment text.',
                    ],
                    'is_internal' => [
                        'type'        => 'boolean',
                        'description' => 'If true, this is an internal note not visible to reporters. Default false.',
                    ],
                ],
                'required' => ['ticket_ulid', 'body'],
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
            $comment = app(CommentService::class)->create(
                $ticket,
                [
                    'body'        => $input['body'],
                    'is_internal' => $input['is_internal'] ?? false,
                ],
                $user
            );

            return [
                'success'     => true,
                'comment_id'  => $comment->id,
                'ticket_ulid' => $ticket->ulid,
                'url'         => "/tickets/{$ticket->ulid}",
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
