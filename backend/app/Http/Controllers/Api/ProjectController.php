<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        $projects = Project::with('owner:id,name,avatar')
            ->withCount(['tickets', 'milestones'])
            ->orderBy('name')
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:150'],
            'key'         => ['required', 'string', 'max:10', 'regex:/^[A-Z0-9]+$/', 'unique:projects,key'],
            'description' => ['nullable', 'string'],
            'color'       => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'owner_id'    => ['nullable', 'exists:users,id'],
        ]);

        $project = Project::create([
            ...$data,
            'color'    => $data['color'] ?? '#6366f1',
            'owner_id' => $data['owner_id'] ?? $request->user()->id,
        ]);

        $project->load('owner:id,name,avatar');

        return response()->json($project, 201);
    }

    public function show(Project $project): JsonResponse
    {
        $project->load([
            'owner:id,name,avatar',
            'milestones' => fn ($q) => $q->withCount(['tickets', 'tickets as completed_tickets_count' => fn ($q) => $q->whereIn('status', ['resolved', 'closed'])]),
        ])->loadCount(['tickets', 'milestones']);

        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:150'],
            'key'         => ['sometimes', 'string', 'max:10', 'regex:/^[A-Z0-9]+$/', 'unique:projects,key,' . $project->id],
            'description' => ['nullable', 'string'],
            'color'       => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'status'      => ['sometimes', 'in:active,archived'],
            'owner_id'    => ['nullable', 'exists:users,id'],
        ]);

        $project->update($data);

        return response()->json($project->fresh(['owner:id,name,avatar']));
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }
}
