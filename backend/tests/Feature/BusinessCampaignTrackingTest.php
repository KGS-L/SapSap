<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BusinessCampaignTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'company-admin']);
        Role::firstOrCreate(['name' => 'super-admin']);
    }

    /**
     * Test 1 : Liste des campagnes entreprise avec métriques de progression
     */
    public function test_business_user_can_list_own_campaigns_with_progress_metrics(): void
    {
        $businessUser = User::factory()->create(['email' => 'contact@sobbra.bf', 'name' => 'Sobbra BF']);
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra Distribution BF',
            'title' => 'Audit PLV Ouaga',
            'type' => 'Audit & Présence',
            'city' => 'Ouagadougou',
            'target_neighborhoods' => 'Patte d\'Oie, Gounghin',
            'missions_count' => 10,
            'reward_per_mission' => 2000,
            'total_budget' => 20000,
            'status' => 'active',
        ]);

        // Créer 4 missions : 2 validées, 1 soumise, 1 disponible
        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 1',
            'location_name' => 'Patte d\'Oie',
            'latitude' => 12.33,
            'longitude' => -1.51,
            'reward' => 2000,
            'status' => 'validated',
        ]);

        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 2',
            'location_name' => 'Patte d\'Oie',
            'latitude' => 12.34,
            'longitude' => -1.52,
            'reward' => 2000,
            'status' => 'validated',
        ]);

        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 3',
            'location_name' => 'Gounghin',
            'latitude' => 12.35,
            'longitude' => -1.53,
            'reward' => 2000,
            'status' => 'submitted',
        ]);

        Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 4',
            'location_name' => 'Gounghin',
            'latitude' => 12.36,
            'longitude' => -1.54,
            'reward' => 2000,
            'status' => 'available',
        ]);

        $response = $this->actingAs($businessUser)->getJson('/api/v1/business/campaigns');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.title', 'Audit PLV Ouaga')
            ->assertJsonPath('data.0.completed_missions', 2)
            ->assertJsonPath('data.0.progress_percent', 20) // 2 / 10 = 20%
            ->assertJsonPath('data.0.spent_budget', 4000)   // 2 * 2000 = 4000 FCFA
            ->assertJsonPath('data.0.remaining_budget', 16000);
    }

    /**
     * Test 2 : Récupération des KPIs de suivi en temps réel et répartition par quartier
     */
    public function test_business_user_can_get_realtime_tracking_kpis_and_neighborhood_stats(): void
    {
        $businessUser = User::factory()->create();
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra Distribution BF',
            'title' => 'Audit Boissons Ouaga',
            'type' => 'Audit & Présence',
            'city' => 'Ouagadougou',
            'target_neighborhoods' => 'Patte d\'Oie, Dassasgho',
            'missions_count' => 5,
            'reward_per_mission' => 2500,
            'total_budget' => 12500,
            'status' => 'active',
        ]);

        $m1 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Maquis Patte d\'Oie',
            'location_name' => 'Patte d\'Oie',
            'latitude' => 12.33,
            'longitude' => -1.51,
            'reward' => 2500,
            'status' => 'validated',
        ]);

        $contributor = User::factory()->create(['name' => 'Moussa Ouédraogo']);

        Submission::create([
            'mission_id' => $m1->id,
            'user_id' => $contributor->id,
            'status' => 'validated',
            'submitted_latitude' => 12.3301,
            'submitted_longitude' => -1.5101,
            'gps_accuracy' => 7.0,
            'gps_distance_meters' => 18.0,
            'answers' => ['Frigos visibles' => '2 frigos'],
            'photos' => ['https://images.unsplash.com/photo-1.jpg'],
            'validated_at' => now(),
        ]);

        $response = $this->actingAs($businessUser)->getJson("/api/v1/business/campaigns/{$campaign->id}/tracking");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.metrics.total_missions', 5)
            ->assertJsonPath('data.metrics.completed_missions', 1)
            ->assertJsonPath('data.metrics.progress_percent', 20)
            ->assertJsonPath('data.metrics.spent_budget', 2500)
            ->assertJsonPath('data.metrics.escrow_remaining', 10000);
    }

    /**
     * Test 3 : Récupération de la carte des résultats avec points, réponses et photos
     */
    public function test_business_user_can_get_results_map_with_submissions_photos_and_answers(): void
    {
        $businessUser = User::factory()->create();
        $businessUser->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $businessUser->id,
            'company_name' => 'Sobbra BF',
            'title' => 'Campagne Carte',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'target_neighborhoods' => 'Gounghin',
            'missions_count' => 1,
            'reward_per_mission' => 3000,
            'total_budget' => 3000,
            'status' => 'active',
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Maquis Plein Air Gounghin',
            'location_name' => 'Gounghin Nord',
            'latitude' => 12.358,
            'longitude' => -1.542,
            'reward' => 3000,
            'status' => 'validated',
        ]);

        $contributor = User::factory()->create(['name' => 'Amina Sawadogo', 'reputation_score' => 95]);

        Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'status' => 'validated',
            'submitted_latitude' => 12.3581,
            'submitted_longitude' => -1.5421,
            'gps_accuracy' => 5.0,
            'gps_distance_meters' => 14.5,
            'answers' => [
                'Frigos visibles' => '2 frigos fonctionnels',
                'Prix Beaufort' => '800 FCFA',
            ],
            'photos' => [
                'https://images.unsplash.com/photo-beer.jpg'
            ],
            'validated_at' => now(),
        ]);

        $response = $this->actingAs($businessUser)->getJson("/api/v1/business/campaigns/{$campaign->id}/results-map");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.title', 'Maquis Plein Air Gounghin')
            ->assertJsonPath('data.0.status', 'validated')
            ->assertJsonPath('data.0.submission.answers.Frigos visibles', '2 frigos fonctionnels')
            ->assertJsonPath('data.0.submission.gps_distance_meters', 14.5)
            ->assertJsonPath('data.0.submission.photos.0', 'https://images.unsplash.com/photo-beer.jpg');
    }

    /**
     * Test 4 : Isolation des données entre différentes entreprises
     */
    public function test_unauthorized_user_cannot_access_other_company_campaign_tracking(): void
    {
        $owner = User::factory()->create(['email' => 'owner@company.bf']);
        $owner->assignRole('company-admin');

        $intruder = User::factory()->create(['email' => 'intruder@othercompany.bf']);
        $intruder->assignRole('company-admin');

        $campaign = Campaign::create([
            'user_id' => $owner->id,
            'company_name' => 'Owner Company',
            'title' => 'Secret Campaign',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'missions_count' => 10,
            'reward_per_mission' => 2000,
            'total_budget' => 20000,
            'status' => 'active',
        ]);

        $response = $this->actingAs($intruder)->getJson("/api/v1/business/campaigns/{$campaign->id}/tracking");
        $response->assertStatus(403);
    }
}
