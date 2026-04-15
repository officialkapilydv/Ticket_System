<?php

namespace App\Services;

use App\Enums\AuditEvent;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\TimeLog;
use App\Models\User;

class TimeLogService
{
    public function log(Ticket $ticket, array $data, User $user): TimeLog
    {
        $timeLog = TimeLog::create([
            ...$data,
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
        ]);

        AuditLog::create([
            'ticket_id'  => $ticket->id,
            'user_id'    => $user->id,
            'event'      => AuditEvent::TimeLogged->value,
            'new_values' => [
                'minutes'     => $data['minutes'],
                'logged_date' => $data['logged_date'],
                'description' => $data['description'] ?? null,
            ],
            'created_at' => now(),
        ]);

        return $timeLog->load('user');
    }

    public function userReport(User $user, string $from, string $to): array
    {
        $logs = TimeLog::with('ticket:id,ulid,title')
            ->where('user_id', $user->id)
            ->whereBetween('logged_date', [$from, $to])
            ->orderBy('logged_date')
            ->get();

        return [
            'logs'          => $logs,
            'total_minutes' => $logs->sum('minutes'),
            'total_hours'   => round($logs->sum('minutes') / 60, 2),
        ];
    }

    public function adminReport(string $from, string $to, ?int $userId = null): array
    {
        $query = TimeLog::with(['user:id,name,email', 'ticket:id,ulid,title'])
            ->whereBetween('logged_date', [$from, $to]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->orderBy('logged_date')->get();

        $byUser = $logs->groupBy('user_id')->map(fn ($userLogs) => [
            'user'          => $userLogs->first()->user,
            'total_minutes' => $userLogs->sum('minutes'),
            'total_hours'   => round($userLogs->sum('minutes') / 60, 2),
            'entries'       => $userLogs->count(),
        ])->values();

        return [
            'logs'          => $logs,
            'by_user'       => $byUser,
            'total_minutes' => $logs->sum('minutes'),
            'total_hours'   => round($logs->sum('minutes') / 60, 2),
        ];
    }

    public function fullReport(string $from, string $to, ?int $userId = null): array
    {
        $query = TimeLog::with([
            'user:id,name,email',
            'task:id,ulid,title,status,project_id',
            'task.project:id,name',
            'task.assignees:id,name',
        ])->whereBetween('logged_date', [$from, $to]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->orderBy('logged_date')->orderBy('created_at')->get();

        $byUser = $logs->groupBy('user_id')->map(fn ($userLogs) => [
            'user'          => $userLogs->first()->user,
            'total_minutes' => $userLogs->sum('minutes'),
            'total_hours'   => round($userLogs->sum('minutes') / 60, 2),
            'entries'       => $userLogs->count(),
        ])->values();

        // Group by task — logs without a task get a null key grouped together
        $byTask = $logs->groupBy('task_id')->map(fn ($taskLogs) => [
            'task'          => $taskLogs->first()->task,
            'project'       => $taskLogs->first()->task?->project,
            'assignees'     => $taskLogs->first()->task?->assignees ?? collect(),
            'total_minutes' => $taskLogs->sum('minutes'),
            'total_hours'   => round($taskLogs->sum('minutes') / 60, 2),
        ])->values();

        $byProject = $logs
            ->filter(fn ($log) => $log->task?->project_id !== null)
            ->groupBy(fn ($log) => $log->task->project_id)
            ->map(fn ($projectLogs) => [
                'project'       => $projectLogs->first()->task->project,
                'total_minutes' => $projectLogs->sum('minutes'),
                'total_hours'   => round($projectLogs->sum('minutes') / 60, 2),
                'entries'       => $projectLogs->count(),
            ])->values();

        return [
            'logs'          => $logs,
            'by_user'       => $byUser,
            'by_task'       => $byTask,
            'by_project'    => $byProject,
            'total_minutes' => $logs->sum('minutes'),
            'total_hours'   => round($logs->sum('minutes') / 60, 2),
        ];
    }
}
