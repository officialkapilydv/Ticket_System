<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TicketController extends Controller
{
    public function __construct(private readonly TicketService $ticketService) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = QueryBuilder::for(Ticket::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('category_id'),
                AllowedFilter::exact('assignee_id'),
                AllowedFilter::exact('reporter_id'),
                AllowedFilter::partial('title'),
            )
            ->allowedSorts('created_at', 'updated_at', 'due_date', 'priority', 'status', 'title')
            ->defaultSort('-created_at')
            ->with(['reporter:id,name,avatar', 'assignee:id,name,avatar', 'category:id,name,color', 'label:id,name,color'])
            ->withCount(['allComments as comments_count', 'attachments as attachments_count'])
            ->paginate($request->get('per_page', 20));

        return response()->json($tickets);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = $this->ticketService->create($request->validated(), $request->user());

        return response()->json($ticket, 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load([
            'reporter:id,name,avatar',
            'assignee:id,name,avatar',
            'category',
            'label',
            'attachments.uploader:id,name',
            'timeLogs.user:id,name',
        ]);

        $ticket->append(['total_hours_logged']);

        return response()->json($ticket);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        $ticket = $this->ticketService->update($ticket, $request->validated(), $request->user());

        return response()->json($ticket);
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted.']);
    }

    public function history(Ticket $ticket): JsonResponse
    {
        $history = $ticket->auditLogs()->with('user:id,name,avatar')->get();

        return response()->json($history);
    }

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('assign', $ticket);

        $request->validate([
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        $ticket = $this->ticketService->assign($ticket, $request->assignee_id, $request->user());

        return response()->json($ticket);
    }

    public function changeStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('changeStatus', $ticket);

        $request->validate([
            'status' => ['required', 'in:open,in_progress,in_review,resolved,closed'],
        ]);

        $ticket = $this->ticketService->changeStatus($ticket, $request->status, $request->user());

        return response()->json($ticket);
    }
}
