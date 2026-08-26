<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'contributor', 'guard_name' => 'web']);
    }

    public function test_get_profile_returns_user_details_and_reputation_score(): void
    {
        $user = User::create([
            'phone_number' => '+22670000000',
            'name' => 'Moussa Sanou',
            'reputation_score' => 100,
            'completed_missions_count' => 0,
        ]);
        $user->assignRole('contributor');

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profil utilisateur récupéré.',
                'data' => [
                    'id' => $user->id,
                    'phone_number' => '+22670000000',
                    'reputation_score' => 100,
                    'completed_missions_count' => 0,
                    'city' => 'Ouagadougou',
                ],
            ]);
    }

    public function test_update_profile_updates_name_and_location(): void
    {
        $user = User::create([
            'phone_number' => '+22670000000',
            'name' => 'Ancien Nom',
            'reputation_score' => 100,
        ]);
        $user->assignRole('contributor');

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/profile', [
                'first_name' => 'Jean',
                'last_name' => 'Kabore',
                'district' => 'Koulouba',
                'city' => 'Ouagadougou',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profil mis à jour avec succès.',
                'data' => [
                    'name' => 'Jean Kabore',
                    'first_name' => 'Jean',
                    'last_name' => 'Kabore',
                    'district' => 'Koulouba',
                    'city' => 'Ouagadougou',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Jean',
            'last_name' => 'Kabore',
            'district' => 'Koulouba',
        ]);
    }

    public function test_update_profile_cannot_tamper_with_reputation_score(): void
    {
        $user = User::create([
            'phone_number' => '+22670000000',
            'reputation_score' => 100,
        ]);
        $user->assignRole('contributor');

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/profile', [
                'district' => 'Dassasgho',
                'reputation_score' => 999,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'reputation_score' => 100,
                    'district' => 'Dassasgho',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'reputation_score' => 100,
        ]);
    }

    public function test_profile_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(401);
    }
}
