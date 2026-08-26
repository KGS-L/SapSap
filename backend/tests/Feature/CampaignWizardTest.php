<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignWizardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_create_campaign_success_for_company_admin(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns', [
                'title' => 'Audit Boutiques Telco',
                'description' => 'Vérification de la PLV et des prix dans les boutiques',
                'mission_type' => 'audit',
                'location_city' => 'Ouagadougou',
                'target_district' => 'Koulouba',
                'required_photos_count' => 2,
                'total_missions_requested' => 10,
                'reward_per_mission' => 2000,
                'questionnaire_schema' => [
                    [
                        'id' => 'q1',
                        'label' => 'Le logo est-il visible ?',
                        'type' => 'boolean',
                        'required' => true,
                    ]
                ],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Campagne créée en brouillon avec succès.',
                'data' => [
                    'title' => 'Audit Boutiques Telco',
                    'mission_type' => 'audit',
                    'reward_per_mission' => 2000,
                    'total_missions_requested' => 10,
                    'subtotal_amount' => 20000,
                    'platform_fee_amount' => 3000, // 15% de 20 000 FCFA
                    'total_budget_amount' => 23000,
                    'status' => 'draft',
                ],
            ]);

        $this->assertDatabaseHas('campaigns', [
            'title' => 'Audit Boutiques Telco',
            'company_id' => $companyAdmin->id,
            'total_budget_amount' => 23000,
            'status' => 'draft',
        ]);
    }

    public function test_create_campaign_fails_with_reward_below_minimum(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns', [
                'title' => 'Campagne Prix Bas',
                'mission_type' => 'audit',
                'required_photos_count' => 1,
                'total_missions_requested' => 5,
                'reward_per_mission' => 200, // En dessous du minimum de 500 FCFA
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Erreur de validation lors de la création de la campagne.',
            ]);
    }

    public function test_company_campaign_isolation(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $companyViewer = User::where('email', 'viewer@sapsap.bf')->first();

        // Campagne créée par Company Admin
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Privée Admin',
            'mission_type' => 'verification',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 5,
            'subtotal_amount' => 5000,
            'platform_fee_amount' => 750,
            'total_budget_amount' => 5750,
            'status' => 'draft',
        ]);

        $viewerToken = $companyViewer->createToken('web-app')->plainTextToken;

        // Tentative d'accès par Company Viewer (autre utilisateur)
        $response = $this->withHeader('Authorization', 'Bearer ' . $viewerToken)
            ->getJson('/api/v1/business/campaigns/' . $campaign->id);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Campagne non trouvée ou accès non autorisé.',
            ]);
    }

    public function test_create_campaign_denied_for_contributor_role(): void
    {
        $contributor = User::create([
            'phone_number' => '+22670999999',
            'name' => 'Simple Contributeur',
        ]);
        $contributor->assignRole('contributor');

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/business/campaigns', [
                'title' => 'Tentative Illégale',
                'mission_type' => 'audit',
                'required_photos_count' => 1,
                'total_missions_requested' => 5,
                'reward_per_mission' => 1000,
            ]);

        $response->assertStatus(403);
    }

    public function test_update_draft_campaign_recalculates_budget(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $token = $companyAdmin->createToken('web-app')->plainTextToken;

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Ancien Titre',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 10,
            'subtotal_amount' => 10000,
            'platform_fee_amount' => 1500,
            'total_budget_amount' => 11500,
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/business/campaigns/' . $campaign->id, [
                'title' => 'Nouveau Titre Campagne',
                'reward_per_mission' => 3000,
                'total_missions_requested' => 5,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Nouveau Titre Campagne',
                    'reward_per_mission' => 3000,
                    'total_missions_requested' => 5,
                    'subtotal_amount' => 15000, // 3000 * 5
                    'platform_fee_amount' => 2250, // 15% de 15 000 FCFA
                    'total_budget_amount' => 17250,
                ],
            ]);
    }
}
