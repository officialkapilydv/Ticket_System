<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->date('logged_date');
            $table->unsignedInteger('minutes');
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'logged_date']);
            $table->index(['user_id', 'logged_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_time_logs');
    }
};
