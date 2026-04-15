<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Models\Comment;
use App\Models\CommentAttachment;
use App\Models\Task;
use App\Models\TimeLog;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function index(Task $task): JsonResponse
    {
        $comments = $task->comments()
            ->with([
                'user:id,name,avatar',
                'attachments',
                'replies.user:id,name,avatar',
                'replies.attachments',
            ])
            ->get();

        return response()->json($comments);
    }

    public function store(StoreCommentRequest $request, Task $task): JsonResponse
    {
        $comment = $this->commentService->createForTask($task, $request->validated(), $request->user());

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

        if ($comment->minutes) {
            TimeLog::create([
                'task_id'     => $task->id,
                'user_id'     => $request->user()->id,
                'logged_date' => $comment->logged_date ?? now()->toDateString(),
                'minutes'     => $comment->minutes,
                'description' => $comment->body ?: null,
            ]);
        }

        // Apply any task field updates sent alongside the comment
        $taskUpdates = [];
        foreach (['status', 'priority', 'label_id', 'category_id', 'due_date', 'progress'] as $field) {
            $value = $request->validated()[$field] ?? null;
            if ($value !== null) {
                $taskUpdates[$field] = $value;
            }
        }
        if (!empty($taskUpdates)) {
            $task->update($taskUpdates);
        }

        $comment->load(['user:id,name,avatar', 'attachments', 'replies.user:id,name,avatar', 'replies.attachments']);

        return response()->json($comment, 201);
    }

    public function update(Request $request, Task $task, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $request->validate(['body' => ['required', 'string', 'max:10000']]);

        $comment->update(['body' => $request->body]);

        return response()->json($comment->fresh(['user:id,name,avatar']));
    }

    public function destroy(Task $task, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
