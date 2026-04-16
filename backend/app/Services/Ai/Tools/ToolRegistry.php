<?php

namespace App\Services\Ai\Tools;

use App\Models\AiActionLog;
use App\Models\User;

class ToolRegistry
{
    /** @return BaseTool[] */
    private function allTools(): array
    {
        return [
            new CreateTicketTool(),
            new SearchTicketsTool(),
            new GetTicketTool(),
            new AddCommentTool(),
            new LogTimeTool(),
            new UpdateTicketTool(),
            new AssignUserTool(),
            new ChangeStatusTool(),
        ];
    }

    /**
     * Returns tool definitions filtered by user role.
     */
    public function definitionsForUser(User $user): array
    {
        return array_map(
            fn (BaseTool $tool) => $tool->definition(),
            $this->toolsForUser($user)
        );
    }

    /**
     * Execute a tool by name, enforcing role restrictions.
     */
    public function execute(string $toolName, array $input, User $user, string $sessionId): array
    {
        $tool = $this->findForUser($toolName, $user);

        if ($tool === null) {
            $result = ['success' => false, 'error' => 'Action not permitted for your role.'];
            $this->log($user, $sessionId, $toolName, $input, $result, 'denied');

            return $result;
        }

        $result = $tool->execute($input, $user);
        $status = ($result['success'] ?? false) ? 'success' : 'failed';
        $this->log($user, $sessionId, $toolName, $input, $result, $status);

        return $result;
    }

    private function toolsForUser(User $user): array
    {
        $tools = [
            new CreateTicketTool(),
            new SearchTicketsTool(),
            new GetTicketTool(),
            new AddCommentTool(),
            new LogTimeTool(),
        ];

        // Agents and admins can update, assign, change status
        if ($user->isAgent() || $user->isAdmin()) {
            $tools[] = new UpdateTicketTool();
            $tools[] = new AssignUserTool();
            $tools[] = new ChangeStatusTool();
        }

        return $tools;
    }

    private function findForUser(string $toolName, User $user): ?BaseTool
    {
        foreach ($this->toolsForUser($user) as $tool) {
            if ($tool->name === $toolName) {
                return $tool;
            }
        }

        return null;
    }

    private function log(User $user, string $sessionId, string $toolName, array $input, array $result, string $status): void
    {
        AiActionLog::create([
            'user_id'    => $user->id,
            'session_id' => $sessionId,
            'tool_name'  => $toolName,
            'tool_input' => $input,
            'tool_result'=> $result,
            'status'     => $status,
            'created_at' => now(),
        ]);
    }
}
