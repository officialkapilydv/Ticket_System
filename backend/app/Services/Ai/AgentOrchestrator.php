<?php

namespace App\Services\Ai;

use Anthropic\Laravel\Facades\Anthropic;
use App\Models\User;
use App\Services\Ai\Tools\ToolRegistry;

class AgentOrchestrator
{
    private const MODEL      = 'claude-sonnet-4-6';
    private const MAX_TOKENS = 1024;

    public function __construct(
        private readonly ToolRegistry        $toolRegistry,
        private readonly ContextBuilder      $contextBuilder,
        private readonly ConversationHistory $history,
    ) {}

    public function handle(User $user, string $message, ?string $sessionId): array
    {
        $sessionId ??= $this->history->newSessionId();

        // 1. Load history and append the new user message
        $messages   = $this->history->load($user->id, $sessionId);
        $messages[] = ['role' => 'user', 'content' => $message];

        $tools        = $this->toolRegistry->definitionsForUser($user);
        $systemPrompt = $this->contextBuilder->build($user);

        // 2. First Claude call
        $response = Anthropic::messages()->create([
            'model'      => self::MODEL,
            'max_tokens' => self::MAX_TOKENS,
            'system'     => $systemPrompt,
            'tools'      => $tools,
            'messages'   => $messages,
        ]);

        // 3. If Claude wants to call a tool
        if ($response->stop_reason === 'tool_use') {
            return $this->handleToolUse($response, $messages, $tools, $systemPrompt, $user, $sessionId, $message);
        }

        // 4. Plain text reply (clarification question, info, etc.)
        $replyText = $this->extractText($response->content);
        $messages[] = ['role' => 'assistant', 'content' => $this->contentToArray($response->content)];

        $this->saveHistory($user->id, $sessionId, $messages, $message);

        return [
            'session_id'   => $sessionId,
            'reply'        => $replyText,
            'action_taken' => null,
        ];
    }

    private function handleToolUse(
        $response,
        array $messages,
        array $tools,
        string $systemPrompt,
        User $user,
        string $sessionId,
        string $originalMessage,
    ): array {
        // Find the tool_use content block
        $toolUseBlock = null;
        foreach ($response->content as $block) {
            if ($block->type === 'tool_use') {
                $toolUseBlock = $block;
                break;
            }
        }

        if ($toolUseBlock === null) {
            return [
                'session_id'   => $sessionId,
                'reply'        => 'I encountered an issue processing your request. Please try again.',
                'action_taken' => null,
            ];
        }

        // Execute the tool
        $toolResult = $this->toolRegistry->execute(
            $toolUseBlock->name,
            $toolUseBlock->input ?? [],
            $user,
            $sessionId
        );

        // Append assistant message with the tool_use block
        $messages[] = ['role' => 'assistant', 'content' => $this->contentToArray($response->content)];

        // Append the tool result
        $messages[] = [
            'role'    => 'user',
            'content' => [[
                'type'        => 'tool_result',
                'tool_use_id' => $toolUseBlock->id,
                'content'     => json_encode($toolResult),
            ]],
        ];

        // Second Claude call — get the natural language confirmation
        $finalResponse = Anthropic::messages()->create([
            'model'      => self::MODEL,
            'max_tokens' => self::MAX_TOKENS,
            'system'     => $systemPrompt,
            'tools'      => $tools,
            'messages'   => $messages,
        ]);

        $replyText  = $this->extractText($finalResponse->content);
        $messages[] = ['role' => 'assistant', 'content' => $this->contentToArray($finalResponse->content)];

        $this->saveHistory($user->id, $sessionId, $messages, $originalMessage);

        return [
            'session_id'   => $sessionId,
            'reply'        => $replyText,
            'action_taken' => $toolResult,
            'tool_name'    => $toolUseBlock->name,
        ];
    }

    /** @param \Anthropic\Responses\Messages\CreateResponseContent[] $content */
    private function extractText(array $content): string
    {
        foreach ($content as $block) {
            if ($block->type === 'text' && $block->text !== null) {
                return $block->text;
            }
        }

        return 'Done.';
    }

    /** @param \Anthropic\Responses\Messages\CreateResponseContent[] $content */
    private function contentToArray(array $content): array
    {
        return array_map(fn ($block) => $block->toArray(), $content);
    }

    private function saveHistory(int $userId, string $sessionId, array $messages, string $firstMessage): void
    {
        // Generate a title from the first user message (trimmed to 60 chars)
        $title = strlen($firstMessage) > 60
            ? substr($firstMessage, 0, 57) . '...'
            : $firstMessage;

        $this->history->save($userId, $sessionId, $messages, $title);
    }
}
