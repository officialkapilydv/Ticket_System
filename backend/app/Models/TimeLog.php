<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeLog extends Model
{
    protected $table = 'ticket_time_logs';

    protected $fillable = ['ticket_id', 'user_id', 'logged_date', 'minutes', 'description'];

    protected $appends = ['hours'];

    protected function casts(): array
    {
        return [
            'logged_date' => 'date',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getHoursAttribute(): float
    {
        return round($this->minutes / 60, 2);
    }
}
