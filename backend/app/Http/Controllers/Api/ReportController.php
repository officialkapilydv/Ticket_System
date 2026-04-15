<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Project Reports — one row per project with ticket counts + hours.
     */
    public function projects(Request $request): JsonResponse
    {
        $projects = Project::withCount([
            'tickets as total_tickets',
            'tickets as open_tickets' => fn ($q) => $q->whereIn('status', ['open', 'in_progress', 'in_review']),
            'tickets as resolved_tickets' => fn ($q) => $q->where('status', 'resolved'),
            'tickets as closed_tickets'   => fn ($q) => $q->where('status', 'closed'),
            'tickets as overdue_tickets'  => fn ($q) => $q->whereNotIn('status', ['resolved', 'closed'])
                                                           ->whereNotNull('due_date')
                                                           ->where('due_date', '<', now()->toDateString()),
            'milestones as milestones_count',
        ])
        ->with('owner:id,name')
        ->orderBy('name')
        ->get()
        ->map(function (Project $project) {
            $hours = TimeLog::whereHas('ticket', fn ($q) => $q->where('project_id', $project->id))
                ->sum('minutes') / 60;

            return [
                'project'           => $project->only(['id', 'name', 'key', 'color', 'status']),
                'owner'             => $project->owner?->only(['id', 'name']),
                'total_tickets'     => $project->total_tickets,
                'open_tickets'      => $project->open_tickets,
                'resolved_tickets'  => $project->resolved_tickets,
                'closed_tickets'    => $project->closed_tickets,
                'overdue_tickets'   => $project->overdue_tickets,
                'milestones_count'  => $project->milestones_count,
                'total_hours'       => round($hours, 2),
            ];
        });

        $totals = [
            'total_tickets'    => $projects->sum('total_tickets'),
            'open_tickets'     => $projects->sum('open_tickets'),
            'resolved_tickets' => $projects->sum('resolved_tickets'),
            'closed_tickets'   => $projects->sum('closed_tickets'),
            'overdue_tickets'  => $projects->sum('overdue_tickets'),
            'total_hours'      => round($projects->sum('total_hours'), 2),
        ];

        return response()->json(['projects' => $projects, 'totals' => $totals]);
    }

    /**
     * Tasks Report — breakdown of the tasks table.
     */
    public function tasks(Request $request): JsonResponse
    {
        $request->validate([
            'project_id'  => ['nullable', 'exists:projects,id'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'status'      => ['nullable', 'string'],
            'priority'    => ['nullable', 'string'],
        ]);

        $base = Task::query()
            ->when($request->project_id,  fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->status,      fn ($q) => $q->where('status', $request->status))
            ->when($request->priority,    fn ($q) => $q->where('priority', $request->priority))
            ->when($request->assignee_id, fn ($q) => $q->whereHas('assignees', fn ($aq) => $aq->where('users.id', $request->assignee_id)));

        $byStatus = (clone $base)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'count' => $row->count]);

        $byPriority = (clone $base)
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->orderByRaw("FIELD(priority, 'critical','high','medium','low')")
            ->get()
            ->map(fn ($row) => ['priority' => $row->priority, 'count' => $row->count]);

        $byProject = (clone $base)
            ->select('project_id', DB::raw('count(*) as count'))
            ->whereNotNull('project_id')
            ->groupBy('project_id')
            ->with('project:id,name,color')
            ->get()
            ->map(fn ($row) => ['project' => $row->project?->only(['id', 'name', 'color']), 'count' => $row->count]);

        $byAssignee = Task::query()
            ->when($request->project_id, fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->status,     fn ($q) => $q->where('status', $request->status))
            ->join('task_assignees', 'tasks.id', '=', 'task_assignees.task_id')
            ->join('users', 'task_assignees.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', DB::raw('count(distinct tasks.id) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => ['user' => ['id' => $row->id, 'name' => $row->name], 'count' => $row->count]);

        $total    = (clone $base)->count();
        $open     = (clone $base)->whereIn('status', ['open', 'in_progress', 'in_review'])->count();
        $resolved = (clone $base)->where('status', 'resolved')->count();
        $closed   = (clone $base)->where('status', 'closed')->count();
        $overdue  = (clone $base)->whereNotIn('status', ['resolved', 'closed'])
                                  ->whereNotNull('due_date')
                                  ->where('due_date', '<', now()->toDateString())
                                  ->count();

        return response()->json([
            'summary'     => compact('total', 'open', 'resolved', 'closed', 'overdue'),
            'by_status'   => $byStatus,
            'by_priority' => $byPriority,
            'by_project'  => $byProject,
            'by_assignee' => $byAssignee,
        ]);
    }

    /**
     * Tickets Report — breakdown of the tickets table.
     */
    public function tickets(Request $request): JsonResponse
    {
        $request->validate([
            'project_id'  => ['nullable', 'exists:projects,id'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'partner_id'  => ['nullable', 'exists:partners,id'],
            'status'      => ['nullable', 'string'],
            'priority'    => ['nullable', 'string'],
        ]);

        $base = Ticket::query()
            ->when($request->project_id,  fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->partner_id,  fn ($q) => $q->where('partner_id', $request->partner_id))
            ->when($request->status,      fn ($q) => $q->where('status', $request->status))
            ->when($request->priority,    fn ($q) => $q->where('priority', $request->priority))
            ->when($request->assignee_id, fn ($q) => $q->whereHas('assignees', fn ($aq) => $aq->where('users.id', $request->assignee_id)));

        $byStatus = (clone $base)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'count' => $row->count]);

        $byPriority = (clone $base)
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->orderByRaw("FIELD(priority, 'critical','high','medium','low')")
            ->get()
            ->map(fn ($row) => ['priority' => $row->priority, 'count' => $row->count]);

        $byProject = (clone $base)
            ->select('project_id', DB::raw('count(*) as count'))
            ->whereNotNull('project_id')
            ->groupBy('project_id')
            ->with('project:id,name,color')
            ->get()
            ->map(fn ($row) => ['project' => $row->project?->only(['id', 'name', 'color']), 'count' => $row->count]);

        $byAssignee = Ticket::query()
            ->when($request->project_id, fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->status,     fn ($q) => $q->where('status', $request->status))
            ->join('ticket_assignees', 'tickets.id', '=', 'ticket_assignees.ticket_id')
            ->join('users', 'ticket_assignees.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', DB::raw('count(distinct tickets.id) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => ['user' => ['id' => $row->id, 'name' => $row->name], 'count' => $row->count]);

        $total    = (clone $base)->count();
        $open     = (clone $base)->whereIn('status', ['open', 'in_progress', 'in_review'])->count();
        $resolved = (clone $base)->where('status', 'resolved')->count();
        $closed   = (clone $base)->where('status', 'closed')->count();
        $overdue  = (clone $base)->whereNotIn('status', ['resolved', 'closed'])
                                  ->whereNotNull('due_date')
                                  ->where('due_date', '<', now()->toDateString())
                                  ->count();

        return response()->json([
            'summary'     => compact('total', 'open', 'resolved', 'closed', 'overdue'),
            'by_status'   => $byStatus,
            'by_priority' => $byPriority,
            'by_project'  => $byProject,
            'by_assignee' => $byAssignee,
        ]);
    }
}
