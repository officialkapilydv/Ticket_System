<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('id')->constrained('projects')->nullOnDelete();
            $table->foreignId('milestone_id')->nullable()->after('project_id')->constrained('milestones')->nullOnDelete();

            $table->index('project_id');
            $table->index('milestone_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['milestone_id']);
            $table->dropColumn(['project_id', 'milestone_id']);
        });
    }
};
