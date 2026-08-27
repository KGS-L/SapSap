<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('media_fingerprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('submissions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('file_hash', 64)->index(); // Hash SHA-256 (64 hex characters)
            $table->string('file_name')->nullable();
            $table->integer('file_size')->default(0); // En octets
            $table->string('photo_url')->nullable();
            $table->timestamps();
        });

        Schema::create('fraud_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('submission_id')->nullable()->constrained('submissions')->onDelete('set null');
            $table->enum('alert_type', ['duplicate_image', 'device_sharing', 'gps_spoofing'])->default('duplicate_image');
            $table->enum('severity', ['low', 'medium', 'high'])->default('high');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('details')->nullable(); // Détails (hash partagé, IDs des autres comptes, etc.)
            $table->enum('status', ['pending', 'investigating', 'resolved', 'dismissed'])->default('pending');
            $table->string('resolution_action')->nullable(); // 'account_suspended', 'score_penalized', 'false_positive'
            $table->text('resolution_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fraud_alerts');
        Schema::dropIfExists('media_fingerprints');
    }
};
