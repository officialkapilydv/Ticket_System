<?php

namespace App\Services;

use App\Enums\AuditEvent;
use App\Events\CommentPosted;
use App\Models\AuditLog;
use App\Models\Comment;
use App\Models\Mention;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CommentService
{
    public function create(Ticket $ticket, array $data, User $author): Comment
    {
        return DB::transaction(function () use ($ticket, $data, $author) {
            $comment = Comment::create([
                ...$data,
                'ticket_id' => $ticket->id,
                'user_id'   => $author->id,
                'body'      => $data['body'] ?? '',
            ]);

            $this->processMentions($comment, $data['body'] ?? '');

            AuditLog::create([
                'ticket_id'  => $ticket->id,
                'user_id'    => $author->id,
                'event'      => AuditEvent::Commented->value,
                'new_values' => ['comment_id' => $comment->id],
                'created_at' => now(),
            ]);

            event(new CommentPosted($comment));

            return $comment->load(['user', 'replies.user', 'mentions.mentionedUser']);
        });
    }

    public function createForTask(Task $task, array $data, User $author): Comment
    {
        return DB::transaction(function () use ($task, $data, $author) {
            $comment = Comment::create([
                ...$data,
                'task_id'   => $task->id,
                'ticket_id' => null,
                'user_id'   => $author->id,
                'body'      => $data['body'] ?? '',
            ]);

            $this->processMentions($comment, $data['body'] ?? '');

            return $comment->load(['user', 'replies.user']);
        });
    }

    private function processMentions(Comment $comment, string $body): void
    {
        preg_match_all('/@(\w+)/', $body, $matches);

        if (empty($matches[1])) {
            return;
        }

        $users = User::whereIn('name', $matches[1])->get();

        foreach ($users as $user) {
            Mention::create([
                'comment_id'        => $comment->id,
                'mentioned_user_id' => $user->id,
            ]);
        }
    }
}
