<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\FraudAlert;
use App\Models\MediaFingerprint;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use App\Services\FraudDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FraudDetectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Test Scenario 1: Image dupliquée détectée (Hash SHA-256 identique)
     */
    public function test_duplicate_image_sha256_creates_fraud_alert_and_marks_submission(): void
    {
        $user1 = User::factory()->create(['name' => 'Moussa Ouédraogo']);
        $user2 = User::factory()->create(['name' => 'Ibrahim Kaboré']);
        
        $campaign = Campaign::create([
            'title' => 'Campagne Audit',
            'company_name' => 'SapSap Test',
            'type' => 'visibility',
            'city' => 'Ouagadougou',
            'status' => 'active'
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Vérification Enseigne',
            'location_name' => 'Gounghin',
            'reward' => 750,
            'status' => 'available'
        ]);

        $sub1 = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $user1->id,
            'status' => 'validated',
            'gps_accuracy' => 4,
            'gps_distance_meters' => 20
        ]);

        $sub2 = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $user2->id,
            'status' => 'submitted',
            'gps_accuracy' => 5,
            'gps_distance_meters' => 25
        ]);

        $sha256Hash = 'a8f5c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111';

        $service = new FraudDetectionService();

        // 1ère soumission : enregistrement normal de l'empreinte
        $alert1 = $service->checkMediaFingerprint($sub1->id, $user1->id, $sha256Hash, 'photo1.jpg', 204800, 'http://img1.jpg');
        $this->assertNull($alert1);
        $this->assertDatabaseHas('media_fingerprints', [
            'file_hash' => $sha256Hash,
            'submission_id' => $sub1->id,
        ]);

        // 2e soumission avec le même hash : détection de fraude
        $alert2 = $service->checkMediaFingerprint($sub2->id, $user2->id, $sha256Hash, 'photo2.jpg', 204800, 'http://img2.jpg');
        $this->assertNotNull($alert2);
        $this->assertEquals('duplicate_image', $alert2->alert_type);
        $this->assertEquals('high', $alert2->severity);
        $this->assertEquals($user2->id, $alert2->user_id);

        // Vérifier que la soumission 2 est marquée fraud_suspect
        $sub2->refresh();
        $this->assertEquals('fraud_suspect', $sub2->status);
    }

    /**
     * Test Scenario 2: Multi-compte sur 1 smartphone (Device ID partagé > 2 comptes)
     */
    public function test_device_sharing_more_than_two_accounts_triggers_fraud_alert(): void
    {
        $u1 = User::factory()->create(['name' => 'User 1']);
        $u2 = User::factory()->create(['name' => 'User 2']);
        $u3 = User::factory()->create(['name' => 'User 3']);

        $campaign = Campaign::create([
            'title' => 'Campagne Device',
            'company_name' => 'SapSap Test',
            'type' => 'visibility',
            'city' => 'Ouagadougou',
            'status' => 'active'
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Test',
            'location_name' => 'Ouaga 2000',
            'reward' => 500,
            'status' => 'available'
        ]);

        $deviceId = 'DEV-BF-OUAGA-8888';

        Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $u1->id,
            'device_id' => $deviceId,
            'status' => 'validated',
            'gps_accuracy' => 5,
            'gps_distance_meters' => 10
        ]);

        Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $u2->id,
            'device_id' => $deviceId,
            'status' => 'validated',
            'gps_accuracy' => 5,
            'gps_distance_meters' => 12
        ]);

        $service = new FraudDetectionService();

        // 3e utilisateur se connecte avec le même device_id
        $alert = $service->checkDeviceSharing($u3->id, $deviceId);

        $this->assertNotNull($alert);
        $this->assertEquals('device_sharing', $alert->alert_type);
        $this->assertEquals('high', $alert->severity);
        $this->assertEquals(3, $alert->details['accounts_count']);
    }

    /**
     * Test Scenario 3: Décision administrateur : Sanctionner (Suspension & Pénalité)
     */
    public function test_admin_can_resolve_fraud_alert_with_account_suspension_or_score_penalty(): void
    {
        $admin = User::factory()->create(['email' => 'admin@sapsap.bf']);
        $contributor = User::factory()->create([
            'reputation_score' => 80,
            'is_active' => true
        ]);

        $alert = FraudAlert::create([
            'user_id' => $contributor->id,
            'alert_type' => 'duplicate_image',
            'severity' => 'high',
            'title' => 'Alerte Test',
            'status' => 'pending'
        ]);

        // 1. Sanction suspension
        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/fraud/alerts/{$alert->id}/resolve", [
                'action' => 'account_suspended',
                'note' => 'Fraude avérée.'
            ]);

        $response->assertStatus(200);
        $alert->refresh();
        $contributor->refresh();

        $this->assertEquals('resolved', $alert->status);
        $this->assertEquals('account_suspended', $alert->resolution_action);
        $this->assertFalse($contributor->is_active);

        // 2. Sanction pénalité de score (-15)
        $contributor2 = User::factory()->create([
            'reputation_score' => 50,
            'is_active' => true
        ]);

        $alert2 = FraudAlert::create([
            'user_id' => $contributor2->id,
            'alert_type' => 'gps_spoofing',
            'severity' => 'medium',
            'title' => 'Alerte GPS',
            'status' => 'pending'
        ]);

        $response2 = $this->actingAs($admin)
            ->postJson("/api/v1/admin/fraud/alerts/{$alert2->id}/resolve", [
                'action' => 'score_penalized',
                'note' => 'Pénalité GPS.'
            ]);

        $response2->assertStatus(200);
        $contributor2->refresh();
        $this->assertEquals(35, $contributor2->reputation_score); // 50 - 15 = 35
    }

    /**
     * Test Scenario 4: Fausse alerte classée sans suite (dismiss)
     */
    public function test_admin_can_dismiss_fraud_alert_as_false_positive(): void
    {
        $admin = User::factory()->create();
        $contributor = User::factory()->create(['is_active' => true, 'reputation_score' => 90]);

        $alert = FraudAlert::create([
            'user_id' => $contributor->id,
            'alert_type' => 'gps_spoofing',
            'severity' => 'medium',
            'title' => 'Alerte GPS',
            'status' => 'pending'
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/fraud/alerts/{$alert->id}/dismiss", [
                'note' => 'Vérification terrain OK.'
            ]);

        $response->assertStatus(200);
        $alert->refresh();
        $contributor->refresh();

        $this->assertEquals('dismissed', $alert->status);
        $this->assertEquals('false_positive', $alert->resolution_action);
        $this->assertTrue($contributor->is_active);
        $this->assertEquals(90, $contributor->reputation_score);
    }
}
