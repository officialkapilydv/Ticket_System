<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $assigned = $user->assignedTickets()
            ->with(['category:id,name,color', 'label:id,name,color', 'reporter:id,name,avatar'])
            ->latest()
            ->get();

        $byStatus = $assigned->groupBy(fn ($t) => $t->status->value)->map->count();

        $resolved  = $assigned->filter(fn ($t) => in_array($t->status->value, ['resolved', 'closed']))->count();
        $open      = $assigned->filter(fn ($t) => $t->status->value === 'open')->count();
        $inProgress = $assigned->filter(fn ($t) => in_array($t->status->value, ['in_progress', 'in_review']))->count();
        $overdue   = $assigned->filter(fn ($t) => $t->isOverdue())->count();
        $total     = $assigned->count();
        $progressPct = $total > 0 ? round(($resolved / $total) * 100) : 0;

        return response()->json([
            'stats' => [
                'total_assigned' => $total,
                'open'           => $open,
                'in_progress'    => $inProgress,
                'resolved'       => $resolved,
                'overdue'        => $overdue,
                'progress_pct'   => $progressPct,
                'by_status'      => $byStatus,
            ],
            'tickets' => $assigned,
        ]);
    }
}
