<?php

namespace App\Services;

use App\Enums\AuditEvent;
use App\Models\AuditLog;
use App\Models\Attachment;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AttachmentService
{
    public function store(Ticket $ticket, UploadedFile $file, User $uploader): Attachment
    {
        $path = $file->store("tickets/{$ticket->ulid}/attachments", 'public');

        $attachment = Attachment::create([
            'ticket_id'   => $ticket->id,
            'uploaded_by' => $uploader->id,
            'filename'    => $file->getClientOriginalName(),
            'disk_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
        ]);

        AuditLog::create([
            'ticket_id'  => $ticket->id,
            'user_id'    => $uploader->id,
            'event'      => AuditEvent::AttachmentAdded->value,
            'new_values' => ['filename' => $file->getClientOriginalName()],
            'created_at' => now(),
        ]);

        return $attachment->load('uploader:id,name');
    }

    public function delete(Attachment $attachment): void
    {
        Storage::disk('public')->delete($attachment->disk_path);
        $attachment->delete();
    }
}
