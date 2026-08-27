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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('company_name')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('Audit & Présence'); // Relevé de prix, Audit, Vérification PDV, etc.
            $table->string('city')->default('Ouagadougou');
            $table->string('target_neighborhoods')->nullable(); // Secteurs / Quartiers ciblés
            $table->text('criteria')->nullable(); // Critères d'acceptation / Questionnaire
            $table->integer('missions_count')->default(10);
            $table->integer('reward_per_mission')->default(2500); // En FCFA
            $table->integer('total_budget')->default(25000); // En FCFA
            $table->enum('status', ['draft', 'pending', 'active', 'rejected', 'completed'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
        });

        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('campaigns')->onDelete('cascade');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('title');
            $table->string('location_name');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('reward')->default(2500);
            $table->enum('status', ['available', 'reserved', 'submitted', 'validated', 'rejected'])->default('available');
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('reservation_expires_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('missions');
        Schema::dropIfExists('campaigns');
    }
};
