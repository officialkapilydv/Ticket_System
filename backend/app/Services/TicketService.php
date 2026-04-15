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
            $assigneeIds = $data['assignee_ids'] ?? [];
            unset($data['assignee_ids']);

            $ticket = Ticket::create([
                ...$data,
                'reporter_id' => $reporter->id,
                'status'      => TicketStatus::Open->value,
            ]);

            if (!empty($assigneeIds)) {
                $ticket->assignees()->sync($assigneeIds);
            }

            AuditLog::create([
                'ticket_id'  => $ticket->id,
                'user_id'    => $reporter->id,
                'event'      => AuditEvent::Created->value,
                'new_values' => ['title' => $ticket->title, 'priority' => $ticket->priority->value],
                'created_at' => now(),
            ]);

            event(new TicketCreated($ticket));

            return $ticket->load(['reporter', 'assignees', 'category']);
        });
    }

    public function update(Ticket $ticket, array $data, User $actor): Ticket
    {
        return DB::transaction(function () use ($ticket, $data, $actor) {
            $assigneeIds = array_key_exists('assignee_ids', $data) ? $data['assignee_ids'] : null;
            unset($data['assignee_ids']);

            $trackedKeys = ['title', 'description', 'priority', 'status', 'category_id', 'due_date'];
            $oldValues   = array_intersect_key($ticket->getRawOriginal(), array_flip($trackedKeys));
            $oldAssigneeIds = $ticket->assignees()->pluck('users.id')->sort()->values()->toArray();

            $ticket->update($data);
            $ticket->refresh();

            if ($assigneeIds !== null) {
                $ticket->assignees()->sync($assigneeIds);
            }

            $newValues = array_intersect_key($ticket->getRawOriginal(), array_flip($trackedKeys));
            $changed   = array_diff_assoc($newValues, $oldValues);

            $newAssigneeIds = $ticket->assignees()->pluck('users.id')->sort()->values()->toArray();
            if ($oldAssigneeIds !== $newAssigneeIds) {
                $changed['assignee_ids'] = $newAssigneeIds;
            }

            if (!empty($changed)) {
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

                if (isset($changed['assignee_ids']) && !empty($newAssigneeIds)) {
                    event(new TicketAssigned($ticket, null));
                }

                event(new TicketUpdated($ticket));
            }

            return $ticket->load(['reporter', 'assignees', 'category']);
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

    public function assign(Ticket $ticket, array $assigneeIds, User $actor): Ticket
    {
        $oldIds = $ticket->assignees()->pluck('users.id')->toArray();

        $ticket->assignees()->sync($assigneeIds);

        AuditLog::create([
            'ticket_id'  => $ticket->id,
            'user_id'    => $actor->id,
            'event'      => !empty($assigneeIds) ? AuditEvent::Assigned->value : AuditEvent::Unassigned->value,
            'old_values' => ['assignee_ids' => $oldIds],
            'new_values' => ['assignee_ids' => $assigneeIds],
            'created_at' => now(),
        ]);

        if (!empty($assigneeIds)) {
            event(new TicketAssigned($ticket, null));
        }

        return $ticket->load('assignees');
    }
}
