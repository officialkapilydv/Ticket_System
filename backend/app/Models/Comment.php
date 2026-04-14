<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Comment extends Model
{
    protected $table = 'ticket_comments';

    use SoftDeletes;

    protected $fillable = ['ticket_id', 'user_id', 'parent_id', 'body', 'is_internal'];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->with('user');
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(Mention::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(CommentAttachment::class);
    }
}
