<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_pay_campaign_success_locks_escrow_and_updates_status(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne à Régler',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 10,
            'subtotal_amount' => 20000,
            'platform_fee_amount' => 3000,
            'total_budget_amount' => 23000,
            'escrow_balance' => 0,
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns/' . $campaign->id . '/pay', [
                'payment_method' => 'orange_money',
                'phone_number' => '+22670123456',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Paiement simulé effectué et budget séquestré avec succès. La campagne est en attente d\'approbation.',
                'data' => [
                    'campaign_id' => $campaign->id,
                    'campaign_status' => 'pending_approval',
                    'escrow_balance' => 23000,
                    'payment_method' => 'orange_money',
                ],
            ]);

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'escrow_balance' => 23000,
            'status' => 'pending_approval',
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'campaign_id' => $campaign->id,
            'user_id' => $companyAdmin->id,
            'transaction_type' => 'campaign_escrow_deposit',
            'amount' => 23000,
            'status' => 'escrow_locked',
            'payment_method' => 'orange_money',
        ]);
    }

    public function test_pay_campaign_fails_if_already_paid(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Déjà Réglée',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 5,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'escrow_balance' => 5750,
            'status' => 'pending_approval',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns/' . $campaign->id . '/pay', [
                'payment_method' => 'moov_money',
                'phone_number' => '+22670123456',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Cette campagne a déjà été réglée ou est en cours de traitement.',
            ]);
    }

    public function test_pay_campaign_fails_with_invalid_phone(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Numéro Invalide',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 5,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns/' . $campaign->id . '/pay', [
                'payment_method' => 'orange_money',
                'phone_number' => '+3360000000', // Format non burkinabè
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Erreur de validation lors du paiement.',
            ]);
    }
}
