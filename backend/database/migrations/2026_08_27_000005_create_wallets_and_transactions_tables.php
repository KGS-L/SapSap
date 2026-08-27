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
        // 1. Table des portefeuilles utilisateurs
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->unsignedInteger('pending_balance')->default(0); // Gains en attente de modération (FCFA)
            $table->unsignedInteger('available_balance')->default(0); // Gains disponibles pour retrait (FCFA)
            $table->unsignedInteger('total_earned')->default(0); // Cumul historique des gains validés (FCFA)
            $table->timestamps();
        });

        // 2. Registre comptable immuable à partie double
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', [
                'mission_earning',     // Crédit gain de mission validée
                'withdrawal_debit',    // Débit demande de retrait Mobile Money
                'withdrawal_refund',   // Remboursement en cas d'échec de retrait
                'escrow_deposit',      // Dépôt séquestre par une entreprise
                'bonus',               // Bonus de parrainage ou fidélité
                'penalty'              // Pénalité financière
            ]);
            $table->integer('amount'); // Montant en FCFA (+ ou -)
            $table->unsignedInteger('balance_before'); // Solde avant opération
            $table->unsignedInteger('balance_after'); // Solde après opération
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('completed');
            $table->string('reference')->unique(); // ex: TXN-2026-0827-0001
            $table->json('metadata')->nullable(); // Données contextuelles (mission_id, operator, phone, etc.)
            $table->timestamps();
        });

        // 3. Table des demandes de retraits Mobile Money (Orange Money / Moov Money)
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
            $table->string('reference')->unique(); // ex: WTH-2026-0827-0001
            $table->unsignedInteger('amount'); // Montant >= 1 000 FCFA
            $table->enum('provider', ['orange_money', 'moov_money', 'telecel'])->default('orange_money');
            $table->string('phone_number'); // Numéro Mobile Money (+226...)
            $table->enum('status', ['pending', 'processing', 'completed', 'rejected', 'failed'])->default('completed');
            $table->string('simulated_payout_id')->nullable(); // Réf retour du SimulatedPaymentDriver
            $table->timestamp('processed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
