<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TicketAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Ticket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'ticket_assigned',
            'ticket_id'  => $this->ticket->id,
            'ticket_ulid'=> $this->ticket->ulid,
            'title'      => $this->ticket->title,
            'message'    => "You have been assigned to ticket: {$this->ticket->title}",
        ];
    }
}
