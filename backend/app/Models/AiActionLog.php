<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiActionLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'session_id',
        'tool_name',
        'tool_input',
        'tool_result',
        'status',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'tool_input'  => 'array',
            'tool_result' => 'array',
            'created_at'  => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
