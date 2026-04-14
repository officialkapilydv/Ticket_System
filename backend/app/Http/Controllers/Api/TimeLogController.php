<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimeLogRequest;
use App\Models\Ticket;
use App\Models\TimeLog;
use App\Services\TimeLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeLogController extends Controller
{
    public function __construct(private readonly TimeLogService $timeLogService) {}

    public function index(Ticket $ticket): JsonResponse
    {
        $logs = $ticket->timeLogs()->with('user:id,name,avatar')->orderByDesc('logged_date')->get();

        return response()->json($logs);
    }

    public function store(StoreTimeLogRequest $request, Ticket $ticket): JsonResponse
    {
        $timeLog = $this->timeLogService->log($ticket, $request->validated(), $request->user());

        return response()->json($timeLog, 201);
    }

    public function update(Request $request, Ticket $ticket, TimeLog $timeLog): JsonResponse
    {
        if ($timeLog->ticket_id !== $ticket->id) abort(404);

        $request->validate([
            'minutes'     => ['sometimes', 'integer', 'min:1', 'max:1440'],
            'description' => ['nullable', 'string', 'max:500'],
            'logged_date' => ['sometimes', 'date'],
        ]);

        $timeLog->update($request->only(['minutes', 'description', 'logged_date']));

        return response()->json($timeLog->fresh('user:id,name,avatar'));
    }

    public function destroy(Ticket $ticket, TimeLog $timeLog): JsonResponse
    {
        if ($timeLog->ticket_id !== $ticket->id) abort(404);

        $timeLog->delete();

        return response()->json(['message' => 'Time log deleted.']);
    }

    public function myReport(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date', 'after_or_equal:from'],
        ]);

        $report = $this->timeLogService->userReport($request->user(), $request->from, $request->to);

        return response()->json($report);
    }
}
