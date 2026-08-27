<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BusinessCampaignExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'company-admin']);
        Role::firstOrCreate(['name' => 'super-admin']);
    }

    /**
     * Test 1 : Exportation CSV avec en-têtes complets, BOM UTF-8 et données de mission
     */
    public function test_business_user_can_export_campaign_data_in_csv_format(): void
    {
        $businessUser = User::factory()->create(['email' => 'direction@sobbra.bf', 'name' => 'Sobbra BF']);
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra Distribution BF',
            'title' => 'Audit Visibilité Sobbra Ouaga',
            'type' => 'Audit & Présence',
            'city' => 'Ouagadougou',
            'target_neighborhoods' => 'Patte d\'Oie, Dassasgho',
            'missions_count' => 2,
            'reward_per_mission' => 2500,
            'total_budget' => 5000,
            'status' => 'active',
        ]);

        $m1 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Maquis Le Régal Patte d\'Oie',
            'location_name' => 'Patte d\'Oie, Face échangeur',
            'latitude' => 12.3325,
            'longitude' => -1.5120,
            'reward' => 2500,
            'status' => 'validated',
        ]);

        $contributor = User::factory()->create(['name' => 'Moussa Ouédraogo', 'phone' => '+22670112233', 'reputation_score' => 96]);

        Submission::create([
            'mission_id' => $m1->id,
            'user_id' => $contributor->id,
            'status' => 'validated',
            'submitted_latitude' => 12.3326,
            'submitted_longitude' => -1.5121,
            'gps_accuracy' => 5.5,
            'gps_distance_meters' => 15.0,
            'answers' => [
                'Affiches visibles' => 'Oui, grande bâche PLV',
                'Frigos Sobbra' => '2 frigos opérationnels',
                'Prix Beaufort' => '800 FCFA'
            ],
            'photos' => [
                'https://sapsap.bf/photos/facade-1.jpg',
                'https://sapsap.bf/photos/frigo-1.jpg'
            ],
            'validated_at' => now(),
        ]);

        $response = $this->actingAs($businessUser)->get("/api/v1/business/campaigns/{$campaign->id}/export/csv");

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment; filename=', (string) $response->headers->get('content-disposition'));

        // Vérification du contenu CSV streamé
        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        // Vérification du BOM UTF-8
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        // Vérification des colonnes et données
        $this->assertStringContainsString('ID Mission;Titre Mission;Campagne;', $content);
        $this->assertStringContainsString('Maquis Le Régal Patte d\'Oie', $content);
        $this->assertStringContainsString('Patte d\'Oie, Face échangeur', $content);
        $this->assertStringContainsString('Moussa Ouédraogo', $content);
        $this->assertStringContainsString('15 m', $content);
        $this->assertStringContainsString('Affiches visibles: Oui, grande bâche PLV', $content);
        $this->assertStringContainsString('https://sapsap.bf/photos/facade-1.jpg', $content);
    }

    /**
     * Test 2 : Exportation Excel SpreadsheetML (.xls XML)
     */
    public function test_business_user_can_export_campaign_data_in_excel_format(): void
    {
        $businessUser = User::factory()->create();
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra BF',
            'title' => 'Campagne Excel Test',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'missions_count' => 1,
            'reward_per_mission' => 2000,
            'total_budget' => 2000,
            'status' => 'active',
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Point Gounghin',
            'location_name' => 'Gounghin Nord',
            'latitude' => 12.358,
            'longitude' => -1.542,
            'reward' => 2000,
            'status' => 'validated',
        ]);

        $contributor = User::factory()->create(['name' => 'Amina Sawadogo']);

        Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'status' => 'validated',
            'submitted_latitude' => 12.3581,
            'submitted_longitude' => -1.5421,
            'gps_distance_meters' => 12.0,
            'answers' => ['Stock' => '10 casiers'],
            'photos' => ['https://sapsap.bf/photos/p1.jpg'],
            'validated_at' => now(),
        ]);

        $response = $this->actingAs($businessUser)->get("/api/v1/business/campaigns/{$campaign->id}/export/excel");

        $response->assertStatus(200);
        $this->assertStringContainsString('application/vnd.ms-excel', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('.xls', (string) $response->headers->get('content-disposition'));

        $content = $response->getContent();
        $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<Workbook', $content);
        $this->assertStringContainsString('<Worksheet', $content);
        $this->assertStringContainsString('Point Gounghin', $content);
        $this->assertStringContainsString('Gounghin Nord', $content);
        $this->assertStringContainsString('Amina Sawadogo', $content);
    }

    /**
     * Test 3 : Filtrage par statut dans l'exportation
     */
    public function test_export_filters_by_status(): void
    {
        $businessUser = User::factory()->create();
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra BF',
            'title' => 'Campagne Filtres',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'missions_count' => 2,
            'reward_per_mission' => 2500,
            'total_budget' => 5000,
            'status' => 'active',
        ]);

        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Validée',
            'location_name' => 'Patte d\'Oie',
            'latitude' => 12.33,
            'longitude' => -1.51,
            'reward' => 2500,
            'status' => 'validated',
        ]);

        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission En Attente',
            'location_name' => 'Dassasgho',
            'latitude' => 12.38,
            'longitude' => -1.49,
            'reward' => 2500,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($businessUser)->get("/api/v1/business/campaigns/{$campaign->id}/export/csv?status=validated");

        $response->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('Mission Validée', $content);
        $this->assertStringNotContainsString('Mission En Attente', $content);
    }

    /**
     * Test 4 : Isolation multi-tenant (interdiction d'exporter la campagne d'un tiers)
     */
    public function test_unauthorized_user_cannot_export_other_company_campaign(): void
    {
        $owner = User::factory()->create(['email' => 'owner@company.bf']);
        $owner->assignRole('company-admin');

        $intruder = User::factory()->create(['email' => 'intruder@competitor.bf']);
        $intruder->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $owner->id,
            'company_name' => 'Owner Company',
            'title' => 'Campagne Secrète',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'missions_count' => 10,
            'reward_per_mission' => 2000,
            'total_budget' => 20000,
            'status' => 'active',
        ]);

        $response = $this->actingAs($intruder)->getJson("/api/v1/business/campaigns/{$campaign->id}/export/csv");
        $response->assertStatus(403);
    }

    /**
     * Test 5 : Campagne inexistante retourne 404
     */
    public function test_export_returns_404_for_non_existent_campaign(): void
    {
        $businessUser = User::factory()->create();
        $businessUser->assignRole('company-admin');

        $response = $this->actingAs($businessUser)->getJson('/api/v1/business/campaigns/99999/export/csv');
        $response->assertStatus(404);
    }
}
