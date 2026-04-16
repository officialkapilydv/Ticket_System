<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_action_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('session_id');
            $table->string('tool_name', 100);
            $table->json('tool_input');
            $table->json('tool_result');
            $table->enum('status', ['success', 'failed', 'denied']);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'session_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_action_logs');
    }
};