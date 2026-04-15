<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Milestone extends Model
{
    protected $fillable = ['project_id', 'name', 'description', 'status', 'start_date', 'due_date'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date'   => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function getTicketsCountAttribute(): int
    {
        return $this->tickets()->count();
    }

    public function getCompletedTicketsCountAttribute(): int
    {
        return $this->tickets()->whereIn('status', ['resolved', 'closed'])->count();
    }

    public function getProgressAttribute(): int
    {
        $total = $this->tickets_count;
        if ($total === 0) {
            return 0;
        }

        return (int) round(($this->completed_tickets_count / $total) * 100);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'completed';
    }
}
