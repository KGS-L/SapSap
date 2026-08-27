<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MobileAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'contributor', 'guard_name' => 'web']);
    }

    public function test_request_otp_success_with_valid_burkina_phone(): void
    {
        $response = $this->postJson('/api/v1/auth/mobile/request-otp', [
            'phone_number' => '+22670000000',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Code OTP généré avec succès.',
                'data' => [
                    'phone_number' => '+22670000000',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'phone_number' => '+22670000000',
        ]);
    }

    public function test_request_otp_fails_with_invalid_phone_number(): void
    {
        $response = $this->postJson('/api/v1/auth/mobile/request-otp', [
            'phone_number' => '12345',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Format de numéro de téléphone invalide.',
            ]);
    }

    public function test_verify_otp_success_and_returns_sanctum_token(): void
    {
        // 1. Demande d'OTP
        $this->postJson('/api/v1/auth/mobile/request-otp', [
            'phone_number' => '+22670000000',
        ]);

        // 2. Vérification OTP
        $response = $this->postJson('/api/v1/auth/mobile/verify-otp', [
            'phone_number' => '+22670000000',
            'otp_code' => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Authentification réussie.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'phone_number',
                        'reputation_score',
                    ],
                ],
            ]);

        $user = User::where('phone_number', '+22670000000')->first();
        $this->assertTrue($user->hasRole('contributor'));
    }

    public function test_verify_otp_fails_with_invalid_otp(): void
    {
        $this->postJson('/api/v1/auth/mobile/request-otp', [
            'phone_number' => '+22670000000',
        ]);

        // Forcer un OTP différent et non simulation
        $user = User::where('phone_number', '+22670000000')->first();
        $user->update([
            'otp_code' => '999999',
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/mobile/verify-otp', [
            'phone_number' => '+22670000000',
            'otp_code' => '000000',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Code OTP invalide ou expiré.',
            ]);
    }
}
