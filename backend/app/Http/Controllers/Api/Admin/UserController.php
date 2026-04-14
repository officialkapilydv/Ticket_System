<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->orderBy('name')
            ->paginate(20);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => ['required', Password::min(8)],
            'role'     => ['required', new Enum(UserRole::class)],
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'role'  => ['sometimes', new Enum(UserRole::class)],
        ]);

        $user->update($request->only(['name', 'email', 'role']));

        return response()->json($user->fresh());
    }

    public function deactivate(User $user, Request $request): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot deactivate yourself.'], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return response()->json(['message' => "User {$status} successfully.", 'user' => $user]);
    }

    public function agents(): JsonResponse
    {
        $agents = User::whereIn('role', ['admin', 'agent'])->where('is_active', true)->get(['id', 'name', 'avatar']);
        return response()->json($agents);
    }

    public function profile(User $user): JsonResponse
    {
        // Ticket stats
        $assignedTickets = $user->assignedTickets()
            ->with(['category:id,name,color', 'reporter:id,name,avatar'])
            ->latest()
            ->get();

        $statusCounts = $assignedTickets->groupBy(fn ($t) => $t->status->value)
            ->map->count();

        $priorityCounts = $assignedTickets->groupBy(fn ($t) => $t->priority->value)
            ->map->count();

        $overdue = $assignedTickets->filter(fn ($t) => $t->isOverdue())->count();

        $resolved = $assignedTickets->filter(
            fn ($t) => in_array($t->status->value, ['resolved', 'closed'])
        )->count();

        $total = $assignedTickets->count();
        $progressPct = $total > 0 ? round(($resolved / $total) * 100) : 0;

        // Time logged (all time)
        $totalMinutes = $user->timeLogs()->sum('minutes');

        // Time logged this month
        $monthMinutes = $user->timeLogs()
            ->whereMonth('logged_date', now()->month)
            ->whereYear('logged_date', now()->year)
            ->sum('minutes');

        return response()->json([
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role->value,
                'avatar_url' => $user->avatar_url,
                'timezone'   => $user->timezone,
                'is_active'  => $user->is_active,
                'created_at' => $user->created_at,
            ],
            'stats' => [
                'total_assigned'  => $total,
                'resolved'        => $resolved,
                'overdue'         => $overdue,
                'progress_pct'    => $progressPct,
                'by_status'       => $statusCounts,
                'by_priority'     => $priorityCounts,
                'total_hours'     => round($totalMinutes / 60, 1),
                'month_hours'     => round($monthMinutes / 60, 1),
            ],
            'tickets' => $assignedTickets,
        ]);
    }
}
