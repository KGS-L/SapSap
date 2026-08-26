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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->onDelete('set null');
            $table->string('transaction_type'); // campaign_escrow_deposit, contributor_payout, refund, fee_collection
            $table->integer('amount'); // FCFA
            $table->integer('balance_before')->default(0);
            $table->integer('balance_after')->default(0);
            $table->string('payment_method'); // orange_money, moov_money, system_escrow
            $table->string('payment_reference')->unique();
            $table->string('status')->default('initiated'); // initiated, escrow_locked, released, withdrawn, failed
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
