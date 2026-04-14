<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Models\Comment;
use App\Models\CommentAttachment;
use App\Models\Ticket;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function index(Ticket $ticket): JsonResponse
    {
        $comments = $ticket->comments()
            ->with([
                'user:id,name,avatar',
                'attachments',
                'replies.user:id,name,avatar',
                'replies.attachments',
            ])
            ->get();

        return response()->json($comments);
    }

    public function store(StoreCommentRequest $request, Ticket $ticket): JsonResponse
    {
        $comment = $this->commentService->create($ticket, $request->validated(), $request->user());

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store("comments/{$comment->id}", 'public');
                CommentAttachment::create([
                    'comment_id'  => $comment->id,
                    'uploaded_by' => $request->user()->id,
                    'filename'    => $file->getClientOriginalName(),
                    'disk_path'   => $path,
                    'mime_type'   => $file->getMimeType(),
                    'file_size'   => $file->getSize(),
                ]);
            }
        }

        $comment->load(['user:id,name,avatar', 'attachments', 'replies.user:id,name,avatar', 'replies.attachments']);

        return response()->json($comment, 201);
    }

    public function update(Request $request, Ticket $ticket, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $request->validate(['body' => ['required', 'string', 'max:10000']]);

        $comment->update(['body' => $request->body]);

        return response()->json($comment->fresh(['user:id,name,avatar']));
    }

    public function destroy(Ticket $ticket, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
