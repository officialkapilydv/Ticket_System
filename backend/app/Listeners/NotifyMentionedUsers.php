<?php

namespace App\Listeners;

use App\Events\CommentPosted;
use App\Notifications\MentionedInComment;
use Illuminate\Support\Carbon;

class NotifyMentionedUsers
{
    public function handle(CommentPosted $event): void
    {
        $comment = $event->comment->load('mentions.mentionedUser');

        foreach ($comment->mentions as $mention) {
            $user = $mention->mentionedUser;

            if ($user && $user->id !== $comment->user_id) {
                $user->notify(new MentionedInComment($comment));
                $mention->update(['notified_at' => Carbon::now()]);
            }
        }
    }
}
