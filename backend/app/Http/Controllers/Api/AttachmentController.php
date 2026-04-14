<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Ticket;
use App\Services\AttachmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function __construct(private readonly AttachmentService $attachmentService) {}

    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip,csv'],
        ]);

        $attachment = $this->attachmentService->store($ticket, $request->file('file'), $request->user());

        return response()->json($attachment, 201);
    }

    public function destroy(Ticket $ticket, Attachment $attachment): JsonResponse
    {
        if ($attachment->ticket_id !== $ticket->id) {
            abort(404);
        }

        $this->authorize('delete', $ticket);

        $this->attachmentService->delete($attachment);

        return response()->json(['message' => 'Attachment deleted.']);
    }

    public function download(Ticket $ticket, Attachment $attachment): mixed
    {
        if ($attachment->ticket_id !== $ticket->id) {
            abort(404);
        }

        if (! Storage::disk('public')->exists($attachment->disk_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download($attachment->disk_path, $attachment->filename);
    }
}
