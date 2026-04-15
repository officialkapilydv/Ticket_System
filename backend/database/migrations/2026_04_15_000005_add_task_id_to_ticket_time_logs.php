<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_time_logs', function (Blueprint $table) {
            // Allow logging time against a task (separate from tickets)
            $table->foreignId('task_id')
                  ->nullable()
                  ->after('ticket_id')
                  ->constrained('tasks')
                  ->cascadeOnDelete();

            // Make ticket_id nullable so logs can belong to either a ticket or a task
            $table->foreignId('ticket_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ticket_time_logs', function (Blueprint $table) {
            $table->dropForeign(['task_id']);
            $table->dropColumn('task_id');
            $table->foreignId('ticket_id')->nullable(false)->change();
        });
    }
};
