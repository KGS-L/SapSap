<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileMissionSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_submit_mission_success_when_within_100m_radius(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Soumission',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670987654',
            'name' => 'Adama Traoré',
        ]);
        $contributor->assignRole('contributor');

        // Mission située au centre exact de Ouagadougou
        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Soumission Test',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'required_photos_count' => 1,
            'status' => 'assigned',
            'assigned_user_id' => $contributor->id,
            'assigned_at' => now(),
            'expires_at' => now()->addMinutes(45),
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        // Coordonnées soumises à 10 mètres du centre (lat: 12.371500)
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $mission->id . '/submit', [
                'latitude' => 12.371500,
                'longitude' => -1.519700,
                'answers' => [
                    'q1' => 'Le magasin est ouvert',
                    'q2' => 'Produit disponible',
                ],
                'photo_urls' => [
                    'https://sapsap.bf/uploads/photo1.jpg',
                ],
                'device_id' => 'DEVICE-ANDROID-XYZ123',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Soumission enregistrée avec succès. Elle est en attente de vérification.',
                'data' => [
                    'mission_id' => $mission->id,
                    'status' => 'pending_review',
                ],
            ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'submitted',
        ]);

        $this->assertDatabaseHas('submissions', [
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'device_id' => 'DEVICE-ANDROID-XYZ123',
            'status' => 'pending_review',
        ]);
    }

    public function test_submit_mission_fails_when_outside_100m_radius(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Hors Périmètre',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670987655',
            'name' => 'Ibrahim Bamba',
        ]);
        $contributor->assignRole('contributor');

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Périmètre Strict',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'required_photos_count' => 1,
            'status' => 'assigned',
            'assigned_user_id' => $contributor->id,
            'assigned_at' => now(),
            'expires_at' => now()->addMinutes(45),
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        // Position à ~950 mètres de la mission (lat: 12.380000)
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $mission->id . '/submit', [
                'latitude' => 12.380000,
                'longitude' => -1.519700,
                'photo_urls' => ['https://sapsap.bf/uploads/photo1.jpg'],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('Proximité géolocalisée insuffisante', $response->json('message'));
    }

    public function test_submit_mission_fails_if_not_assigned_to_user(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Autre User',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $user1 = User::create(['phone_number' => '+22670000001', 'name' => 'User One']);
        $user2 = User::create(['phone_number' => '+22670000002', 'name' => 'User Two']);
        $user2->assignRole('contributor');

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission User 1',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'status' => 'assigned',
            'assigned_user_id' => $user1->id,
            'assigned_at' => now(),
            'expires_at' => now()->addMinutes(45),
        ]);

        $token2 = $user2->createToken('mobile-app')->plainTextToken;

        // User 2 tente de soumettre la mission réservée par User 1
        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->postJson('/api/v1/missions/' . $mission->id . '/submit', [
                'latitude' => 12.371420,
                'longitude' => -1.519700,
                'photo_urls' => ['https://sapsap.bf/uploads/photo1.jpg'],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Vous n\'avez pas réservé cette mission ou le délai de 45 minutes a expiré.',
            ]);
    }
}
