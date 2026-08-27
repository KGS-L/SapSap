<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_contributor_can_get_balance_and_transactions(): void
    {
        $contributor = User::create([
            'phone_number' => '+22670111222',
            'name' => 'Moussa Wallet',
        ]);
        $contributor->assignRole('contributor');

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Wallet',
            'mission_type' => 'audit',
            'reward_per_mission' => 2500,
            'total_missions_requested' => 2,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'status' => 'active',
        ]);

        WalletTransaction::create([
            'user_id' => $contributor->id,
            'campaign_id' => $campaign->id,
            'transaction_type' => 'contributor_payout',
            'amount' => 2500,
            'payment_method' => 'system_escrow',
            'payment_reference' => 'TEST-REF-1',
            'status' => 'released',
        ]);

        WalletTransaction::create([
            'user_id' => $contributor->id,
            'campaign_id' => $campaign->id,
            'transaction_type' => 'contributor_payout',
            'amount' => 2500,
            'payment_method' => 'system_escrow',
            'payment_reference' => 'TEST-REF-2',
            'status' => 'released',
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/wallet/balance');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'available_balance' => 5000,
                    'total_earned' => 5000,
                    'total_withdrawn' => 0,
                    'currency' => 'FCFA',
                ],
            ]);

        $this->assertCount(2, $response->json('data.transactions'));
    }

    public function test_contributor_can_withdraw_funds_to_mobile_money(): void
    {
        $contributor = User::create([
            'phone_number' => '+22670222333',
            'name' => 'Fatou Withdraw',
        ]);
        $contributor->assignRole('contributor');

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Withdraw',
            'mission_type' => 'audit',
            'reward_per_mission' => 5000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'status' => 'active',
        ]);

        WalletTransaction::create([
            'user_id' => $contributor->id,
            'campaign_id' => $campaign->id,
            'transaction_type' => 'contributor_payout',
            'amount' => 5000,
            'payment_method' => 'system_escrow',
            'payment_reference' => 'TEST-REF-3',
            'status' => 'released',
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/wallet/withdraw', [
                'amount' => 3000,
                'payment_method' => 'orange_money',
                'phone_number' => '+22670222333',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'amount_withdrawn' => 3000,
                    'new_available_balance' => 2000,
                    'status' => 'completed',
                ],
            ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $contributor->id,
            'transaction_type' => 'withdrawal',
            'amount' => 3000,
            'status' => 'completed',
        ]);
    }

    public function test_withdraw_fails_when_amount_exceeds_available_balance(): void
    {
        $contributor = User::create([
            'phone_number' => '+22670333444',
            'name' => 'Paul Exceed',
        ]);
        $contributor->assignRole('contributor');

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Exceed',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        WalletTransaction::create([
            'user_id' => $contributor->id,
            'campaign_id' => $campaign->id,
            'transaction_type' => 'contributor_payout',
            'amount' => 2000,
            'payment_method' => 'system_escrow',
            'payment_reference' => 'TEST-REF-4',
            'status' => 'released',
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/wallet/withdraw', [
                'amount' => 5000,
                'payment_method' => 'moov_money',
                'phone_number' => '+22670333444',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('Solde insuffisant', $response->json('message'));
    }

    public function test_withdraw_fails_when_amount_below_minimum(): void
    {
        $contributor = User::create([
            'phone_number' => '+22670444555',
            'name' => 'Awa Min',
        ]);
        $contributor->assignRole('contributor');

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/wallet/withdraw', [
                'amount' => 200, // Moins que le minimum de 500 ou 1000 FCFA
                'payment_method' => 'orange_money',
                'phone_number' => '+22670444555',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $errorsJson = json_encode($response->json());
        $this->assertStringContainsString('minimum', strtolower($errorsJson));
    }
}
