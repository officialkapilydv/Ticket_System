<?php

namespace App\Enums;

enum TicketPriority: string
{
    case Low      = 'low';
    case Medium   = 'medium';
    case High     = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match($this) {
            self::Low      => 'Low',
            self::Medium   => 'Medium',
            self::High     => 'High',
            self::Critical => 'Critical',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Low      => 'green',
            self::Medium   => 'blue',
            self::High     => 'orange',
            self::Critical => 'red',
        };
    }

    public function sortOrder(): int
    {
        return match($this) {
            self::Critical => 1,
            self::High     => 2,
            self::Medium   => 3,
            self::Low      => 4,
        };
    }
}
