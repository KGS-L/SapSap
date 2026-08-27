<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCampaignValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_approve_paid_campaign_and_generate_missions(): void
    {
        $superAdmin = User::where('email', 'admin@sapsap.bf')->first();
        $token = $superAdmin->createToken('web-app')->plainTextToken;

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne à Modérer',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 5,
            'subtotal_amount' => 10000,
            'platform_fee_amount' => 1500,
            'total_budget_amount' => 11500,
            'escrow_balance' => 11500,
            'status' => 'pending_approval',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/admin/campaigns/' . $campaign->id . '/approve');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'campaign_id' => $campaign->id,
                    'campaign_status' => 'active',
                    'missions_created' => 5,
                ],
            ]);

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseCount('missions', 5);
        $this->assertDatabaseHas('missions', [
            'campaign_id' => $campaign->id,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'status' => 'available',
        ]);
    }

    public function test_admin_cannot_approve_unpaid_draft_campaign(): void
    {
        $superAdmin = User::where('email', 'admin@sapsap.bf')->first();
        $token = $superAdmin->createToken('web-app')->plainTextToken;

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Brouillon Non Payée',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 5,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'escrow_balance' => 0,
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/admin/campaigns/' . $campaign->id . '/approve');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Seules les campagnes réglées et en attente d\'approbation peuvent être approuvées.',
            ]);
    }

    public function test_admin_can_reject_campaign_with_reason(): void
    {
        $superAdmin = User::where('email', 'admin@sapsap.bf')->first();
        $token = $superAdmin->createToken('web-app')->plainTextToken;

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Non Conforme',
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
            ->postJson('/api/v1/admin/campaigns/' . $campaign->id . '/reject', [
                'rejection_reason' => 'Le questionnaire ne respecte pas les critères de clarté.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'campaign_id' => $campaign->id,
                    'campaign_status' => 'rejected',
                ],
            ]);

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'rejected',
        ]);
    }

    public function test_non_admin_cannot_access_approval_endpoint(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Test Rôle',
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
            ->postJson('/api/v1/admin/campaigns/' . $campaign->id . '/approve');

        $response->assertStatus(403);
    }
}
