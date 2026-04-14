<?php

namespace App\Enums;

enum TicketLabel: string
{
    case New            = 'new';
    case QaReported     = 'qa_reported';
    case ClientReported = 'client_reported';
    case Reporting      = 'reporting';
    case Idea           = 'idea';
}
