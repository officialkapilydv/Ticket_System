<?php

namespace App\Models;

use App\Enums\TicketLabel;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ulid', 'title', 'description', 'status', 'priority', 'label',
        'category_id', 'reporter_id', 'assignee_id',
        'due_date', 'estimated_hours', 'resolved_at', 'jira_issue_key',
    ];

    protected function casts(): array
    {
        return [
            'status'       => TicketStatus::class,
            'priority'     => TicketPriority::class,
            'label'        => TicketLabel::class,
            'due_date'     => 'date',
            'resolved_at'  => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket) {
            if (empty($ticket->ulid)) {
                $ticket->ulid = Str::ulid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id')->with('replies.user', 'user');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->orderByDesc('created_at');
    }

    public function getTotalMinutesLoggedAttribute(): int
    {
        return $this->timeLogs()->sum('minutes');
    }

    public function getTotalHoursLoggedAttribute(): float
    {
        return round($this->total_minutes_logged / 60, 2);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && ! $this->status->isTerminal();
    }
}
