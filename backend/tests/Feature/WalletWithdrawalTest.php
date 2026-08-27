<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1: Demande de retrait valide (>= 1 000 FCFA) avec solde suffisant
     */
    public function test_contributor_can_request_valid_withdrawal_above_1000_fcfa(): void
    {
        $user = User::factory()->create(['name' => 'Moussa Ouédraogo', 'phone' => '+226 70 12 34 56']);
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'available_balance' => 5000,
            'total_earned' => 5000,
        ]);

        $walletService = app(WalletService::class);
        $result = $walletService->requestWithdrawal($user, 2000, 'orange_money', '+226 70 12 34 56');

        $this->assertTrue($result['success']);
        $this->assertEquals(3000, $result['wallet']['available_balance']);

        // Vérifier la décrémentation en base
        $wallet->refresh();
        $this->assertEquals(3000, $wallet->available_balance);

        // Vérifier l'inscription au registre comptable immuable
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'user_id' => $user->id,
            'type' => 'withdrawal_debit',
            'amount' => -2000,
            'balance_before' => 5000,
            'balance_after' => 3000,
            'status' => 'completed',
        ]);

        // Vérifier l'enregistrement de la demande de retrait avec payout ID simulé
        $this->assertDatabaseHas('withdrawal_requests', [
            'user_id' => $user->id,
            'amount' => 2000,
            'provider' => 'orange_money',
            'status' => 'completed',
        ]);
    }

    /**
     * Test 2: Rejet d'une demande inférieure à 1 000 FCFA (Invariance Règle Métier)
     */
    public function test_withdrawal_under_1000_fcfa_is_rejected(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'available_balance' => 5000,
            'total_earned' => 5000,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Le seuil minimal de retrait est de 1 000 FCFA.");

        $walletService = app(WalletService::class);
        $walletService->requestWithdrawal($user, 500, 'orange_money', '+226 70 00 00 00');
    }

    /**
     * Test 3: Rejet d'une demande supérieure au solde disponible
     */
    public function test_withdrawal_exceeding_available_balance_is_rejected(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'available_balance' => 2000,
            'total_earned' => 2000,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Solde disponible insuffisant");

        $walletService = app(WalletService::class);
        $walletService->requestWithdrawal($user, 4000, 'moov_money', '+226 76 00 00 00');
    }

    /**
     * Test 4: Validation de mission crédite automatiquement le portefeuille
     */
    public function test_mission_validation_automatically_credits_contributor_wallet(): void
    {
        $user = User::factory()->create();
        $campaign = Campaign::create([
            'title' => 'Campagne Sobbra',
            'company_name' => 'Sobbra BF',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'status' => 'active'
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Audit Kiosque',
            'location_name' => 'Gounghin',
            'reward' => 3000,
            'status' => 'submitted'
        ]);

        $submission = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'created_at' => now(),
        ]);

        $walletService = app(WalletService::class);
        $transaction = $walletService->creditMissionEarning($submission);

        $this->assertEquals(3000, $transaction->amount);
        $this->assertEquals(0, $transaction->balance_before);
        $this->assertEquals(3000, $transaction->balance_after);

        $wallet = $user->wallet()->first();
        $this->assertNotNull($wallet);
        $this->assertEquals(3000, $wallet->available_balance);
        $this->assertEquals(3000, $wallet->total_earned);
    }
}
