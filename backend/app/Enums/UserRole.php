<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Agent = 'agent';
    case User  = 'user';

    public function label(): string
    {
        return match($this) {
            self::Admin => 'Administrator',
            self::Agent => 'Agent',
            self::User  => 'User',
        };
    }

    public function canManageUsers(): bool
    {
        return $this === self::Admin;
    }

    public function canAssignTickets(): bool
    {
        return in_array($this, [self::Admin, self::Agent]);
    }
}
