<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('color', 7)->default('#6366f1');
            $table->timestamps();
        });

        // Seed default labels matching the old enum values
        DB::table('labels')->insert([
            ['name' => 'New',             'slug' => 'new',             'color' => '#0ea5e9', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'QA Reported',     'slug' => 'qa_reported',     'color' => '#f97316', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Client Reported', 'slug' => 'client_reported', 'color' => '#f43f5e', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Reporting',       'slug' => 'reporting',       'color' => '#8b5cf6', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Idea',            'slug' => 'idea',            'color' => '#10b981', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('labels');
    }
};
