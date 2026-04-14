<?php

namespace App\Enums;

enum AuditEvent: string
{
    case Created         = 'created';
    case Updated         = 'updated';
    case Assigned        = 'assigned';
    case Unassigned      = 'unassigned';
    case StatusChanged   = 'status_changed';
    case PriorityChanged = 'priority_changed';
    case Commented       = 'commented';
    case AttachmentAdded = 'attachment_added';
    case TimeLogged      = 'time_logged';
    case Resolved        = 'resolved';
    case Closed          = 'closed';
    case Reopened        = 'reopened';
}
