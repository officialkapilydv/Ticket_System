<?php

namespace App\Listeners;

use App\Events\TicketAssigned;
use App\Notifications\TicketAssignedNotification;

class SendTicketAssignedNotification
{
    public function handle(TicketAssigned $event): void
    {
        $ticket = $event->ticket;

        if ($ticket->assignee) {
            $ticket->assignee->notify(new TicketAssignedNotification($ticket));
        }
    }
}
