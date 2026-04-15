<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('category_id'),
                AllowedFilter::scope('assignee'),
                AllowedFilter::exact('reporter_id'),
                AllowedFilter::exact('project_id'),
                AllowedFilter::exact('milestone_id'),
                AllowedFilter::partial('title'),
            )
            ->allowedSorts('created_at', 'updated_at', 'due_date', 'priority', 'status', 'title')
            ->defaultSort('-created_at')
            ->with(['reporter:id,name,avatar', 'assignees', 'category:id,name,color', 'label:id,name,color', 'project:id,name,key,color', 'milestone:id,name,status'])
            ->paginate($request->get('per_page', 20));

        return response()->json($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $data = $request->validated();
        $assigneeIds = $data['assignee_ids'] ?? [];
        unset($data['assignee_ids']);

        $task = Task::create([
            ...$data,
            'ulid'        => Str::ulid(),
            'reporter_id' => $request->user()->id,
        ]);

        if (!empty($assigneeIds)) {
            $task->assignees()->sync($assigneeIds);
        }

        $task->load(['reporter:id,name,avatar', 'assignees', 'category', 'label', 'project:id,name,key,color', 'milestone:id,name,status']);

        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        $task->load([
            'reporter:id,name,avatar',
            'assignees',
            'category',
            'label',
            'project:id,name,key,color',
            'milestone:id,name,status,due_date',
        ]);

        return response()->json($task);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $data = $request->validated();
        $assigneeIds = $data['assignee_ids'] ?? null;
        unset($data['assignee_ids']);

        $task->update($data);

        if ($assigneeIds !== null) {
            $task->assignees()->sync($assigneeIds);
        }

        $task->load(['reporter:id,name,avatar', 'assignees', 'category', 'label', 'project:id,name,key,color', 'milestone:id,name,status']);

        return response()->json($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    public function assign(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'assignee_ids'   => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
        ]);

        $task->assignees()->sync($request->input('assignee_ids', []));
        $task->load('assignees');

        return response()->json($task);
    }

    public function changeStatus(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:open,in_progress,in_review,resolved,closed'],
        ]);

        $data = ['status' => $request->status];
        if ($request->status === 'resolved' && ! $task->resolved_at) {
            $data['resolved_at'] = now();
        } elseif (in_array($request->status, ['open', 'in_progress', 'in_review'])) {
            $data['resolved_at'] = null;
        }

        $task->update($data);

        return response()->json($task);
    }
}
