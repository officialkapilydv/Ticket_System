<?php

namespace App\Services;

use App\Enums\AuditEvent;
use App\Enums\TicketStatus;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketStatusChanged;
use App\Events\TicketUpdated;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TicketService
{
    public function create(array $data, User $reporter): Ticket
    {
        return DB::transaction(function () use ($data, $reporter) {
            $ticket = Ticket::create([
                ...$data,
                'reporter_id' => $reporter->id,
                'status'      => TicketStatus::Open->value,
            ]);

            AuditLog::create([
                'ticket_id'  => $ticket->id,
                'user_id'    => $reporter->id,
                'event'      => AuditEvent::Created->value,
                'new_values' => ['title' => $ticket->title, 'priority' => $ticket->priority->value],
                'created_at' => now(),
            ]);

            event(new TicketCreated($ticket));

            return $ticket->load(['reporter', 'assignee', 'category']);
        });
    }

    public function update(Ticket $ticket, array $data, User $actor): Ticket
    {
        return DB::transaction(function () use ($ticket, $data, $actor) {
            $trackedKeys = ['title', 'description', 'priority', 'status', 'assignee_id', 'category_id', 'due_date'];
            $oldValues   = array_intersect_key($ticket->getRawOriginal(), array_flip($trackedKeys));
            $oldAssignee = $ticket->assignee_id;

            $ticket->update($data);
            $ticket->refresh();

            $newValues = array_intersect_key($ticket->getRawOriginal(), array_flip($trackedKeys));
            $changed = array_diff_assoc($newValues, $oldValues);

            if (! empty($changed)) {
                AuditLog::create([
                    'ticket_id'  => $ticket->id,
                    'user_id'    => $actor->id,
                    'event'      => AuditEvent::Updated->value,
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'created_at' => now(),
                ]);

                if (isset($changed['status'])) {
                    event(new TicketStatusChanged($ticket, $oldValues['status']));
                }

                if (isset($changed['assignee_id']) && $ticket->assignee_id) {
                    event(new TicketAssigned($ticket, $oldAssignee));
                }

                event(new TicketUpdated($ticket));
            }

            return $ticket->load(['reporter', 'assignee', 'category']);
        });
    }

    public function changeStatus(Ticket $ticket, string $status, User $actor): Ticket
    {
        $oldStatus = $ticket->status->value;

        $ticket->update([
            'status'      => $status,
            'resolved_at' => in_array($status, ['resolved', 'closed']) ? now() : null,
        ]);

        AuditLog::create([
            'ticket_id'  => $ticket->id,
            'user_id'    => $actor->id,
            'event'      => AuditEvent::StatusChanged->value,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $status],
            'created_at' => now(),
        ]);

        event(new TicketStatusChanged($ticket, $oldStatus));

        return $ticket->refresh();
    }

    public function assign(Ticket $ticket, ?int $assigneeId, User $actor): Ticket
    {
        $oldAssignee = $ticket->assignee_id;

        $ticket->update(['assignee_id' => $assigneeId]);

        AuditLog::create([
            'ticket_id'  => $ticket->id,
            'user_id'    => $actor->id,
            'event'      => $assigneeId ? AuditEvent::Assigned->value : AuditEvent::Unassigned->value,
            'old_values' => ['assignee_id' => $oldAssignee],
            'new_values' => ['assignee_id' => $assigneeId],
            'created_at' => now(),
        ]);

        if ($assigneeId) {
            event(new TicketAssigned($ticket, $oldAssignee));
        }

        return $ticket->load('assignee');
    }
}
