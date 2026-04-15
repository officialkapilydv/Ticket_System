<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_assignees', function (Blueprint $table) {
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['ticket_id', 'user_id']);
        });

        // Migrate existing single assignee_id data into the pivot
        DB::table('tickets')
            ->whereNotNull('assignee_id')
            ->orderBy('id')
            ->each(function ($ticket) {
                DB::table('ticket_assignees')->insertOrIgnore([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $ticket->assignee_id,
                ]);
            });

        // Drop the old single-assignee column
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['assignee_id']);
            $table->dropColumn('assignee_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::dropIfExists('ticket_assignees');
    }
};
