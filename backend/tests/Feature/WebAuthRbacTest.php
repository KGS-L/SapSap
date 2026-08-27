<?php

namespace Tests\Feature;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebAuthRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_web_login_success_for_super_admin(): void
    {
        $response = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'admin@sapsap.bf',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Connexion réussie.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'roles',
                    ],
                ],
            ]);

        $this->assertContains('super-admin', $response->json('data.user.roles'));
    }

    public function test_web_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'admin@sapsap.bf',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Identifiants invalides (email ou mot de passe incorrect).',
            ]);
    }

    public function test_web_login_fails_with_invalid_email_format(): void
    {
        $response = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'invalid-email',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Erreur de validation du formulaire de connexion.',
            ]);
    }

    public function test_rbac_access_allowed_for_super_admin(): void
    {
        $loginResponse = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'admin@sapsap.bf',
            'password' => 'password',
        ]);

        $token = $loginResponse->json('data.token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/test-rbac');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Accès Admin/Validateur autorisé.',
            ]);
    }

    public function test_rbac_access_denied_403_for_company_viewer(): void
    {
        $loginResponse = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'viewer@sapsap.bf',
            'password' => 'password',
        ]);

        $token = $loginResponse->json('data.token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/test-rbac');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Accès refusé : vous n\'avez pas les rôles ou autorisations requis.',
            ]);
    }

    public function test_web_logout_success(): void
    {
        $loginResponse = $this->postJson('/api/v1/auth/web/login', [
            'email' => 'admin@sapsap.bf',
            'password' => 'password',
        ]);

        $token = $loginResponse->json('data.token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/web/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Déconnexion réussie.',
            ]);
    }
}
