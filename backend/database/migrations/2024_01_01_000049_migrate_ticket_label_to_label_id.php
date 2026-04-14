<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add label_id foreign key column
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('label_id')->nullable()->after('priority')->constrained('labels')->nullOnDelete();
        });

        // Migrate existing label string values to label_id
        $labels = DB::table('labels')->pluck('id', 'slug');
        foreach ($labels as $slug => $id) {
            DB::table('tickets')->where('label', $slug)->update(['label_id' => $id]);
        }

        // Drop old label column
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('label');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('label')->nullable()->after('priority');
        });

        // Restore label string values from label_id
        $labels = DB::table('labels')->pluck('slug', 'id');
        foreach ($labels as $id => $slug) {
            DB::table('tickets')->where('label_id', $id)->update(['label' => $slug]);
        }

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['label_id']);
            $table->dropColumn('label_id');
        });
    }
};
