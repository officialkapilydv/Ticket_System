<?php

namespace App\Services\Integrations;

use App\Models\Ticket;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackService
{
    private ?string $webhookUrl;

    public function __construct()
    {
        $this->webhookUrl = config('services.slack.webhook_url');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->webhookUrl);
    }

    public function notifyTicketCreated(Ticket $ticket): void
    {
        if (! $this->isConfigured()) return;

        $this->send([
            'text' => ":ticket: New ticket created: *{$ticket->title}*",
            'blocks' => [
                [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => ":ticket: *New Ticket: {$ticket->title}*\n" .
                                  "*Priority:* {$ticket->priority->label()} | *Reporter:* {$ticket->reporter->name}",
                    ],
                ],
            ],
        ]);
    }

    public function notifyTicketStatusChanged(Ticket $ticket, string $oldStatus): void
    {
        if (! $this->isConfigured()) return;

        $this->send([
            'text' => ":arrows_counterclockwise: Ticket *{$ticket->title}* status changed from `{$oldStatus}` to `{$ticket->status->value}`",
        ]);
    }

    private function send(array $payload): void
    {
        try {
            Http::post($this->webhookUrl, $payload);
        } catch (\Throwable $e) {
            Log::error('Slack notification failed', ['error' => $e->getMessage()]);
        }
    }
}
