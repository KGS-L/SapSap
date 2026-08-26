<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignReportExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_business_user_can_get_campaign_report_metrics(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Report Test',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Validée',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 2000,
            'status' => 'validated',
        ]);

        Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $companyAdmin->id,
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'distance_from_target_meters' => 0,
            'submission_hash' => 'HASH-REPORT-1',
            'status' => 'approved',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/business/campaigns/' . $campaign->id . '/report');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'campaign_id' => $campaign->id,
                    'metrics' => [
                        'generated_missions_count' => 1,
                        'validated_missions_count' => 1,
                        'completion_rate_percentage' => 100,
                    ],
                ],
            ]);
    }

    public function test_business_user_can_export_campaign_data_as_json(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Export JSON',
            'mission_type' => 'audit',
            'reward_per_mission' => 1500,
            'total_missions_requested' => 1,
            'subtotal_amount' => 1500,
            'platform_fee_amount' => 225,
            'total_budget_amount' => 1725,
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/business/campaigns/' . $campaign->id . '/export?format=json');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'export_format' => 'json',
                ],
            ]);
    }

    public function test_business_user_can_export_campaign_data_as_csv(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Export CSV',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission CSV Test',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 2000,
            'status' => 'available',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->get('/api/v1/business/campaigns/' . $campaign->id . '/export?format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Mission ID', $content);
        $this->assertStringContainsString('Mission CSV Test', $content);
    }

    public function test_business_user_cannot_access_other_company_campaign_report(): void
    {
        $companyAdmin1 = User::where('email', 'business@sapsap.bf')->first();

        $companyAdmin2 = User::create([
            'email' => 'other_business@sapsap.bf',
            'password' => bcrypt('password'),
            'name' => 'Autre Société',
        ]);
        $companyAdmin2->assignRole('company-admin');

        $campaign = Campaign::create([
            'company_id' => $companyAdmin1->id,
            'title' => 'Campagne Secrete',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $token2 = $companyAdmin2->createToken('web-app')->plainTextToken;

        // User 2 tente d'accéder au rapport de User 1
        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/v1/business/campaigns/' . $campaign->id . '/report');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.',
            ]);
    }
}
