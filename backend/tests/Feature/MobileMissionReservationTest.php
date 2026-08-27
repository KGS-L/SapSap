<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileMissionReservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_contributor_can_list_available_missions_sorted_by_distance(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Test',
            'mission_type' => 'audit',
            'reward_per_mission' => 1500,
            'total_missions_requested' => 2,
            'subtotal_amount' => 3000,
            'platform_fee_amount' => 450,
            'total_budget_amount' => 3450,
            'escrow_balance' => 3450,
            'status' => 'active',
        ]);

        // Mission Proche (0.5 km)
        $m1 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Proche',
            'mission_type' => 'audit',
            'latitude' => 12.375000,
            'longitude' => -1.520000,
            'radius_meters' => 100,
            'reward_amount' => 1500,
            'status' => 'available',
        ]);

        // Mission Éloignée (5 km)
        $m2 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Éloignée',
            'mission_type' => 'audit',
            'latitude' => 12.410000,
            'longitude' => -1.550000,
            'radius_meters' => 100,
            'reward_amount' => 1500,
            'status' => 'available',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670111222',
            'name' => 'Moussa Sanou',
        ]);
        $contributor->assignRole('contributor');

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/missions?lat=12.371420&lng=-1.519700');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals($m1->id, $data[0]['id']);
        $this->assertEquals($m2->id, $data[1]['id']);
    }

    public function test_contributor_can_reserve_mission_for_45_minutes(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Réservation',
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
            'title' => 'Mission à Réserver',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'status' => 'available',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670222333',
            'name' => 'Jean Kabore',
        ]);
        $contributor->assignRole('contributor');

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $mission->id . '/reserve');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Mission réservée avec succès pour 45 minutes.',
                'data' => [
                    'mission_id' => $mission->id,
                    'status' => 'assigned',
                    'lock_duration_minutes' => 45,
                ],
            ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'assigned',
            'assigned_user_id' => $contributor->id,
        ]);
    }

    public function test_contributor_cannot_reserve_second_active_mission(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Multi-Missions',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 2,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $m1 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 1',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 1000,
            'status' => 'available',
        ]);

        $m2 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission 2',
            'mission_type' => 'audit',
            'latitude' => 12.372000,
            'longitude' => -1.520000,
            'reward_amount' => 1000,
            'status' => 'available',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670333444',
            'name' => 'Fatou Ouédraogo',
        ]);
        $contributor->assignRole('contributor');

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        // Première réservation -> Succès
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $m1->id . '/reserve')
            ->assertStatus(200);

        // Deuxième réservation -> Refus 422
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $m2->id . '/reserve');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Vous avez déjà une mission réservée en cours. Veuillez la compléter ou l\'annuler avant d\'en réserver une autre.',
            ]);
    }

    public function test_contributor_can_cancel_reservation(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Annulation',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 1000,
            'platform_fee_amount' => 150,
            'total_budget_amount' => 1150,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670444555',
            'name' => 'Awa Sawadogo',
        ]);
        $contributor->assignRole('contributor');

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission à Annuler',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 1000,
            'status' => 'assigned',
            'assigned_user_id' => $contributor->id,
            'assigned_at' => now(),
            'expires_at' => now()->addMinutes(45),
        ]);

        $token = $contributor->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/missions/' . $mission->id . '/cancel-reservation');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Réservation annulée avec succès. La mission est à nouveau disponible.',
            ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'available',
            'assigned_user_id' => null,
        ]);
    }

    public function test_expired_reservation_is_auto_released(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();

        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Expiration',
            'mission_type' => 'audit',
            'reward_per_mission' => 1000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 1000,
            'platform_fee_amount' => 150,
            'total_budget_amount' => 1150,
            'status' => 'active',
        ]);

        $user1 = User::create([
            'phone_number' => '+22670555666',
            'name' => 'User Expiré',
        ]);

        // Mission verrouillée il y a 50 minutes (expirée)
        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Périmée',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 1000,
            'status' => 'assigned',
            'assigned_user_id' => $user1->id,
            'assigned_at' => now()->subMinutes(50),
            'expires_at' => now()->subMinutes(5),
        ]);

        $user2 = User::create([
            'phone_number' => '+22670666777',
            'name' => 'Nouveau User',
        ]);
        $user2->assignRole('contributor');

        $token = $user2->createToken('mobile-app')->plainTextToken;

        // User 2 consulte les missions -> Le verrou périmé est automatiquement libéré
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/missions');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'available',
            'assigned_user_id' => null,
        ]);
    }
}
