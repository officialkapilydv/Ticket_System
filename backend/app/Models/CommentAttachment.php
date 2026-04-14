<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CommentAttachment extends Model
{
    protected $table = 'comment_attachments';

    protected $fillable = ['comment_id', 'uploaded_by', 'filename', 'disk_path', 'mime_type', 'file_size'];

    protected $appends = ['url', 'human_size', 'is_image'];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return config('app.url') . Storage::url($this->disk_path);
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }
}
