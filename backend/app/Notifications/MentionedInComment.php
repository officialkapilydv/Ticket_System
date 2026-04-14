<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class MentionedInComment extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Comment $comment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'mention',
            'ticket_id'   => $this->comment->ticket_id,
            'ticket_ulid' => $this->comment->ticket->ulid ?? null,
            'comment_id'  => $this->comment->id,
            'author'      => $this->comment->user->name,
            'message'     => "{$this->comment->user->name} mentioned you in a comment",
        ];
    }
}
