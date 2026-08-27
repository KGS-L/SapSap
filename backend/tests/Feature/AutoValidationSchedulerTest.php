<?php

namespace Tests\Feature;

use App\Jobs\CheckPendingSubmissionsJob;
use App\Models\Campaign;
use App\Models\Mission;
use App\Models\SchedulerLog;
use App\Models\Submission;
use App\Models\User;
use App\Services\AutoValidationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoValidationSchedulerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test : Les soumissions de plus de 48h sont auto-validées, les récentes restent 'submitted'
     */
    public function test_submissions_older_than_48h_are_auto_validated_and_recent_are_preserved(): void
    {
        $user = User::factory()->create(['reputation_score' => 80]);
        $campaign = Campaign::create([
            'title' => 'Campagne Test',
            'company_name' => 'SapSap Test',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'status' => 'active'
        ]);

        $mission1 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Ancienne',
            'location_name' => 'Secteur 1',
            'reward' => 2000,
            'status' => 'submitted'
        ]);

        $mission2 = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Récente',
            'location_name' => 'Secteur 2',
            'reward' => 2500,
            'status' => 'submitted'
        ]);

        // Soumission créée il y a 50 heures (> 48h)
        $oldSub = Submission::create([
            'mission_id' => $mission1->id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'created_at' => Carbon::now()->subHours(50),
            'updated_at' => Carbon::now()->subHours(50),
        ]);

        // Soumission créée il y a 2 heures (< 48h)
        $recentSub = Submission::create([
            'mission_id' => $mission2->id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'created_at' => Carbon::now()->subHours(2),
            'updated_at' => Carbon::now()->subHours(2),
        ]);

        $service = app(AutoValidationService::class);
        $result = $service->checkAndAutoValidate(48, 'scheduler');

        $this->assertEquals(1, $result['processed_count']);

        // Vérifier l'ancienne soumission : validée et horodatée
        $oldSub->refresh();
        $this->assertEquals('validated', $oldSub->status);
        $this->assertNotNull($oldSub->validated_at);
        $this->assertNotNull($oldSub->auto_validated_at);

        // Vérifier la mission associée
        $mission1->refresh();
        $this->assertEquals('validated', $mission1->status);

        // Vérifier le score du contributeur (+2)
        $user->refresh();
        $this->assertEquals(82, $user->reputation_score);

        // Vérifier la soumission récente : toujours en attente
        $recentSub->refresh();
        $this->assertEquals('submitted', $recentSub->status);
        $this->assertNull($recentSub->auto_validated_at);

        // Vérifier la création d'un log dans scheduler_logs
        $this->assertDatabaseHas('scheduler_logs', [
            'job_name' => 'CheckPendingSubmissionsJob',
            'processed_count' => 1,
            'status' => 'success',
            'triggered_by' => 'scheduler',
        ]);
    }

    /**
     * Test : Les soumissions suspectes de fraude ne sont JAMAIS auto-validées
     */
    public function test_fraud_suspect_submissions_are_excluded_from_auto_validation(): void
    {
        $user = User::factory()->create(['reputation_score' => 50]);
        $campaign = Campaign::create([
            'title' => 'Campagne Test Fraude',
            'company_name' => 'SapSap Test',
            'type' => 'Audit',
            'city' => 'Ouagadougou',
            'status' => 'active'
        ]);

        $mission = Mission::create([
            'campaign_id' => $campaign->id,
            'title' => 'Mission Suspecte',
            'location_name' => 'Secteur 3',
            'reward' => 1500,
            'status' => 'submitted'
        ]);

        // Soumission marquée fraud_suspect créée il y a 60h
        $fraudSub = Submission::create([
            'mission_id' => $mission->id,
            'user_id' => $user->id,
            'status' => 'fraud_suspect',
            'created_at' => Carbon::now()->subHours(60),
            'updated_at' => Carbon::now()->subHours(60),
        ]);

        $service = app(AutoValidationService::class);
        $result = $service->checkAndAutoValidate(48, 'scheduler');

        $this->assertEquals(0, $result['processed_count']);

        $fraudSub->refresh();
        $this->assertEquals('fraud_suspect', $fraudSub->status);
        $this->assertNull($fraudSub->auto_validated_at);
    }
}
