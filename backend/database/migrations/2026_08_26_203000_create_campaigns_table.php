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
            $table->foreignId('company_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('mission_type')->default('audit');
            $table->string('location_city')->default('Ouagadougou');
            $table->string('target_district')->nullable();
            $table->json('questionnaire_schema')->nullable();
            $table->integer('required_photos_count')->default(1);
            $table->integer('total_missions_requested')->default(1);
            $table->integer('reward_per_mission')->default(1000); // FCFA
            $table->integer('subtotal_amount')->default(1000); // FCFA
            $table->integer('platform_fee_amount')->default(150); // FCFA (15%)
            $table->integer('total_budget_amount')->default(1150); // FCFA
            $table->integer('escrow_balance')->default(0); // FCFA
            $table->string('status')->default('draft'); // draft, pending_payment, pending_approval, active, completed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
