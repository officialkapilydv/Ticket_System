<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open       = 'open';
    case InProgress = 'in_progress';
    case InReview   = 'in_review';
    case Resolved   = 'resolved';
    case Closed     = 'closed';

    public function label(): string
    {
        return match($this) {
            self::Open       => 'Open',
            self::InProgress => 'In Progress',
            self::InReview   => 'In Review',
            self::Resolved   => 'Resolved',
            self::Closed     => 'Closed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Open       => 'blue',
            self::InProgress => 'yellow',
            self::InReview   => 'purple',
            self::Resolved   => 'green',
            self::Closed     => 'gray',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Resolved, self::Closed]);
    }
}
