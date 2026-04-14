<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Events\TicketStatusChanged;
use App\Services\Integrations\SlackService;

class SendSlackNotification
{
    public function __construct(private readonly SlackService $slack) {}

    public function handle(object $event): void
    {
        match(true) {
            $event instanceof TicketCreated       => $this->slack->notifyTicketCreated($event->ticket),
            $event instanceof TicketStatusChanged => $this->slack->notifyTicketStatusChanged($event->ticket, $event->oldStatus),
            default                               => null,
        };
    }
}
