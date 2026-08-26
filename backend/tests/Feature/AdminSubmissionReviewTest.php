<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class AdminSubmissionReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_approve_submission_releases_payout_and_increases_reputation(): void
    {
        $superAdmin = User::where('email', 'admin@sapsap.bf')->first();
        $adminToken = $superAdmin->createToken('web-app')->plainTextToken;

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Revue',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670777888',
            'name' => 'Kassoum Traoré',
            'reputation_score' => 90,
            'completed_missions_count' => 0,
        ]);
        $contributor->assignRole('contributor');

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Revue',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'radius_meters' => 100,
            'reward_amount' => 2000,
            'status' => 'submitted',
            'assigned_user_id' => $contributor->id,
        ]);

        $submission = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'distance_from_target_meters' => 0,
            'answers' => ['q1' => 'ok'],
            'photo_urls' => ['https://sapsap.bf/photo.jpg'],
            'submission_hash' => 'HASH-TEST-12345',
            'status' => 'pending_review',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/v1/admin/submissions/' . $submission->id . '/approve');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'submission_id' => $submission->id,
                    'submission_status' => 'approved',
                    'mission_status' => 'validated',
                    'payout_amount' => 2000,
                    'contributor_reputation_score' => 92, // 90 + 2
                ],
            ]);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'validated',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $contributor->id,
            'reputation_score' => 92,
            'completed_missions_count' => 1,
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $contributor->id,
            'campaign_id' => $campaign->id,
            'transaction_type' => 'contributor_payout',
            'amount' => 2000,
            'status' => 'released',
        ]);
    }

    public function test_admin_reject_submission_resets_mission_and_penalizes_reputation(): void
    {
        $superAdmin = User::where('email', 'admin@sapsap.bf')->first();
        $adminToken = $superAdmin->createToken('web-app')->plainTextToken;

        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Rejet',
            'mission_type' => 'audit',
            'reward_per_mission' => 2000,
            'total_missions_requested' => 1,
            'subtotal_amount' => 2000,
            'platform_fee_amount' => 300,
            'total_budget_amount' => 2300,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670888999',
            'name' => 'Paul Ilboudo',
            'reputation_score' => 90,
        ]);
        $contributor->assignRole('contributor');

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission à Rejeter',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 2000,
            'status' => 'submitted',
            'assigned_user_id' => $contributor->id,
        ]);

        $submission = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'distance_from_target_meters' => 0,
            'submission_hash' => 'HASH-TEST-REJECT',
            'status' => 'pending_review',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/v1/admin/submissions/' . $submission->id . '/reject', [
                'rejection_reason' => 'Photo floue et informations incorrectes.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'submission_id' => $submission->id,
                    'submission_status' => 'rejected',
                    'mission_status' => 'available',
                    'contributor_reputation_score' => 85, // 90 - 5
                ],
            ]);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'rejected',
            'rejection_reason' => 'Photo floue et informations incorrectes.',
        ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'available',
            'assigned_user_id' => null,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $contributor->id,
            'reputation_score' => 85,
        ]);
    }

    public function test_auto_validate_submissions_command(): void
    {
        $companyAdmin = User::where('email', 'business@sapsap.bf')->first();
        $campaign = Campaign::create([
            'company_id' => $companyAdmin->id,
            'title' => 'Campagne Auto Validate',
            'mission_type' => 'audit',
            'reward_per_mission' => 1500,
            'total_missions_requested' => 1,
            'subtotal_amount' => 1500,
            'platform_fee_amount' => 225,
            'total_budget_amount' => 1725,
            'status' => 'active',
        ]);

        $contributor = User::create([
            'phone_number' => '+22670999000',
            'name' => 'User Auto',
            'reputation_score' => 80,
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Périmée 48h',
            'mission_type' => 'audit',
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'reward_amount' => 1500,
            'status' => 'submitted',
            'assigned_user_id' => $contributor->id,
        ]);

        // Soumission créée il y a 49 heures (devant être auto-validée)
        $submission = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $contributor->id,
            'latitude' => 12.371420,
            'longitude' => -1.519700,
            'distance_from_target_meters' => 0,
            'submission_hash' => 'HASH-AUTO-48H',
            'status' => 'pending_review',
        ]);
        $submission->created_at = now()->subHours(49);
        $submission->save();

        Artisan::call('missions:auto-validate');

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'status' => 'validated',
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $contributor->id,
            'amount' => 1500,
            'status' => 'released',
        ]);
    }
}
