<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ulid', 'title', 'description', 'status', 'priority', 'label_id',
        'category_id', 'reporter_id', 'partner_id',
        'project_id', 'milestone_id',
        'due_date', 'estimated_hours', 'progress', 'resolved_at', 'jira_issue_key',
    ];

    protected function casts(): array
    {
        return [
            'status'      => TicketStatus::class,
            'priority'    => TicketPriority::class,
            'due_date'    => 'date',
            'resolved_at' => 'datetime',
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

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ticket_assignees')
                    ->select(['users.id', 'users.name', 'users.avatar']);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function label(): BelongsTo
    {
        return $this->belongsTo(Label::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id')->with('replies.user', 'user');
    }

    public function scopeAssignee($query, $userId): void
    {
        $query->whereHas('assignees', fn ($q) => $q->where('users.id', $userId));
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
