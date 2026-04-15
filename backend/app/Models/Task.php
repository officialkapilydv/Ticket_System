<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ulid', 'title', 'description', 'status', 'priority',
        'category_id', 'label_id', 'reporter_id',
        'project_id', 'milestone_id',
        'due_date', 'estimated_hours', 'progress', 'resolved_at',
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
        static::creating(function (Task $task) {
            if (empty($task->ulid)) {
                $task->ulid = Str::ulid();
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
        return $this->belongsToMany(User::class, 'task_assignees')
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

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'task_id')
                    ->whereNull('parent_id')
                    ->with('replies.user', 'user');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class, 'task_id');
    }

    public function scopeAssignee($query, $userId): void
    {
        $query->whereHas('assignees', fn ($q) => $q->where('users.id', $userId));
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && ! $this->status->isTerminal();
    }
}
