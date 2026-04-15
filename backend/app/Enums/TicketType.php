<?php

namespace App\Enums;

enum TicketType: string
{
    case Task   = 'task';
    case Ticket = 'ticket';

    public function label(): string
    {
        return match($this) {
            self::Task   => 'Task',
            self::Ticket => 'Ticket',
        };
    }
}
