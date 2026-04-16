<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Services\Ai\AgentOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    public function __construct(private readonly AgentOrchestrator $orchestrator) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'    => ['required', 'string', 'max:2000'],
            'session_id' => ['nullable', 'uuid'],
        ]);

        $result = $this->orchestrator->handle(
            user:      $request->user(),
            message:   $validated['message'],
            sessionId: $validated['session_id'] ?? null,
        );

        return response()->json($result);
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = AiConversation::where('user_id', $request->user()->id)
            ->orderByDesc('last_active_at')
            ->select(['id', 'session_id', 'title', 'last_active_at', 'created_at'])
            ->limit(20)
            ->get();

        return response()->json($conversations);
    }
}
