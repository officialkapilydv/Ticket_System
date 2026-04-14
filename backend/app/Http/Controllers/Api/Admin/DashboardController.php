<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $ticketsByStatus = Ticket::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $ticketsByPriority = Ticket::selectRaw('priority, count(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority');

        $recentTickets = Ticket::with(['reporter:id,name', 'assignee:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'ulid', 'title', 'status', 'priority', 'reporter_id', 'assignee_id', 'created_at']);

        $weeklyCreated = Ticket::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $overdueCount = Ticket::whereDate('due_date', '<', now())
            ->whereNotIn('status', ['resolved', 'closed'])
            ->count();

        return response()->json([
            'totals' => [
                'tickets'        => Ticket::count(),
                'open'           => Ticket::where('status', 'open')->count(),
                'overdue'        => $overdueCount,
                'users'          => User::where('is_active', true)->count(),
            ],
            'by_status'       => $ticketsByStatus,
            'by_priority'     => $ticketsByPriority,
            'recent_tickets'  => $recentTickets,
            'weekly_created'  => $weeklyCreated,
        ]);
    }

    public function timeReport(Request $request): JsonResponse
    {
        $from = request('from', now()->startOfMonth()->toDateString());
        $to   = request('to', now()->endOfMonth()->toDateString());

        $service = app(\App\Services\TimeLogService::class);

        return response()->json($service->adminReport($from, $to, request('user_id')));
    }

    public function ticketStats(): JsonResponse
    {
        $avgResolutionHours = Ticket::whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours')
            ->value('avg_hours');

        $topAssignees = Ticket::selectRaw('assignee_id, count(*) as count')
            ->whereNotNull('assignee_id')
            ->groupBy('assignee_id')
            ->orderByDesc('count')
            ->limit(5)
            ->with('assignee:id,name')
            ->get();

        return response()->json([
            'avg_resolution_hours' => round($avgResolutionHours ?? 0, 1),
            'top_assignees'        => $topAssignees,
        ]);
    }
}
