<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $milestones = $project->milestones()
            ->withCount([
                'tickets',
                'tickets as completed_tickets_count' => fn ($q) => $q->whereIn('status', ['resolved', 'closed']),
            ])
            ->get()
            ->each(fn ($m) => $m->append(['progress']));

        return response()->json($milestones);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('create', [Milestone::class, $project]);

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'in:planned,active,completed'],
            'start_date'  => ['nullable', 'date'],
            'due_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $milestone = $project->milestones()->create($data);

        return response()->json($milestone, 201);
    }

    public function update(Request $request, Project $project, Milestone $milestone): JsonResponse
    {
        $this->authorize('update', $milestone);

        abort_if($milestone->project_id !== $project->id, 404);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status'      => ['sometimes', 'in:planned,active,completed'],
            'start_date'  => ['nullable', 'date'],
            'due_date'    => ['nullable', 'date'],
        ]);

        $milestone->update($data);

        return response()->json($milestone->fresh());
    }

    public function destroy(Project $project, Milestone $milestone): JsonResponse
    {
        $this->authorize('delete', $milestone);

        abort_if($milestone->project_id !== $project->id, 404);

        $milestone->delete();

        return response()->json(['message' => 'Milestone deleted.']);
    }
}
