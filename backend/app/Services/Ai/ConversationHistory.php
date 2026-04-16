<?php

namespace App\Services\Ai;

use App\Models\AiConversation;
use Illuminate\Support\Str;

class ConversationHistory
{
    private const MAX_MESSAGES = 20;

    public function load(int $userId, string $sessionId): array
    {
        $conversation = AiConversation::firstOrCreate(
            ['user_id' => $userId, 'session_id' => $sessionId],
            [
                'messages'       => [],
                'last_active_at' => now(),
            ]
        );

        $messages = $conversation->messages ?? [];

        return array_slice($messages, -self::MAX_MESSAGES);
    }

    public function save(int $userId, string $sessionId, array $messages, ?string $title = null): void
    {
        $update = [
            'messages'       => $messages,
            'last_active_at' => now(),
        ];

        if ($title !== null) {
            $update['title'] = $title;
        }

        AiConversation::where('user_id', $userId)
            ->where('session_id', $sessionId)
            ->update($update);
    }

    public function newSessionId(): string
    {
        return (string) Str::uuid();
    }
}
