<?php

namespace App\Services;

use App\Models\SchedulerLog;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoValidationService
{
    protected WalletService $walletService;

    public function __construct(?WalletService $walletService = null)
    {
        $this->walletService = $walletService ?? app(WalletService::class);
    }

    /**
     * Exécute l'auto-validation des soumissions en attente depuis plus de X heures (par défaut 48h)
     *
     * @param int $hoursThreshold Nombre d'heures d'inactivité avant auto-validation (défaut 48h)
     * @param string $triggeredBy 'scheduler' ou 'manual_admin'
     * @param int|null $adminUserId Identifiant de l'administrateur si déclenché manuellement
     * @return array Résumé d'exécution
     */
    public function checkAndAutoValidate(
        int $hoursThreshold = 48,
        string $triggeredBy = 'scheduler',
        ?int $adminUserId = null
    ): array {
        $startTime = microtime(true);
        $thresholdDate = Carbon::now()->subHours($hoursThreshold);

        // Recherche des soumissions éligibles (statut 'submitted' et créées il y a >= 48h)
        // Les soumissions 'fraud_suspect' sont rigoureusement exclues de l'auto-validation
        $eligibleSubmissions = Submission::with(['mission', 'user'])
            ->where('status', 'submitted')
            ->where('created_at', '<=', $thresholdDate)
            ->lockForUpdate()
            ->get();

        $processedSubmissions = [];
        $totalProcessed = 0;

        DB::beginTransaction();
        try {
            foreach ($eligibleSubmissions as $submission) {
                $now = Carbon::now();

                // Mise à jour de la soumission
                $submission->update([
                    'status' => 'validated',
                    'validated_at' => $now,
                    'auto_validated_at' => $now,
                    'rejection_reason' => null,
                    'rejected_at' => null,
                ]);

                // Mise à jour de la mission associée
                if ($submission->mission) {
                    $submission->mission->update(['status' => 'validated']);
                }

                // Incrémenter le score de réputation du contributeur (+2 points, max 100)
                if ($submission->user && $submission->user->reputation_score < 100) {
                    $submission->user->increment('reputation_score', min(2, 100 - $submission->user->reputation_score));
                }

                // Créditer le portefeuille du contributeur (Story 5.1)
                $this->walletService->creditMissionEarning($submission);


                $processedSubmissions[] = [
                    'submission_id' => $submission->id,
                    'contributor_name' => $submission->user?->name ?? 'Contributeur',
                    'mission_title' => $submission->mission?->title ?? 'Mission',
                    'reward' => $submission->mission?->reward ?? 0,
                    'submitted_at' => $submission->created_at->toIso8601String(),
                    'auto_validated_at' => $now->toIso8601String(),
                ];

                $totalProcessed++;
            }

            $executionDurationMs = round((microtime(true) - $startTime) * 1000, 2);

            // Création de l'entrée de journalisation d'exécution
            $log = SchedulerLog::create([
                'job_name' => 'CheckPendingSubmissionsJob',
                'executed_at' => Carbon::now(),
                'processed_count' => $totalProcessed,
                'status' => 'success',
                'details' => [
                    'hours_threshold' => $hoursThreshold,
                    'duration_ms' => $executionDurationMs,
                    'processed_items' => $processedSubmissions,
                ],
                'triggered_by' => $triggeredBy,
                'admin_user_id' => $adminUserId,
            ]);

            DB::commit();

            Log::info("SapSap Scheduler: {$totalProcessed} soumissions auto-validées avec succès (seuil: {$hoursThreshold}h, durée: {$executionDurationMs}ms).");

            return [
                'success' => true,
                'processed_count' => $totalProcessed,
                'hours_threshold' => $hoursThreshold,
                'duration_ms' => $executionDurationMs,
                'log_id' => $log->id,
                'executed_at' => $log->executed_at->toIso8601String(),
                'items' => $processedSubmissions,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("SapSap Scheduler: Erreur lors de l'auto-validation des soumissions: {$e->getMessage()}", [
                'exception' => $e
            ]);

            SchedulerLog::create([
                'job_name' => 'CheckPendingSubmissionsJob',
                'executed_at' => Carbon::now(),
                'processed_count' => 0,
                'status' => 'failed',
                'details' => [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ],
                'triggered_by' => $triggeredBy,
                'admin_user_id' => $adminUserId,
            ]);

            throw $e;
        }
    }

    /**
     * Nombre de soumissions actuellement en attente et éligibles (> 48h)
     */
    public function getPendingEligibleCount(int $hoursThreshold = 48): int
    {
        $thresholdDate = Carbon::now()->subHours($hoursThreshold);

        return Submission::where('status', 'submitted')
            ->where('created_at', '<=', $thresholdDate)
            ->count();
    }

    /**
     * Statistiques globales du Scheduler pour le tableau de bord et monitoring
     */
    public function getSchedulerStats(): array
    {
        $lastLog = SchedulerLog::latest('executed_at')->first();
        $totalAutoValidated = Submission::whereNotNull('auto_validated_at')->count();
        $pendingOver48h = $this->getPendingEligibleCount(48);
        $totalSubmissions = Submission::count();

        return [
            'is_active' => true,
            'interval_description' => 'Toutes les heures (0 * * * *)',
            'auto_validation_delay_hours' => 48,
            'pending_eligible_count' => $pendingOver48h,
            'total_auto_validated_count' => $totalAutoValidated,
            'total_submissions_count' => $totalSubmissions,
            'last_run' => $lastLog ? [
                'id' => $lastLog->id,
                'executed_at' => $lastLog->executed_at->toIso8601String(),
                'processed_count' => $lastLog->processed_count,
                'status' => $lastLog->status,
                'triggered_by' => $lastLog->triggered_by,
            ] : null,
            'next_estimated_run' => Carbon::now()->addHour()->startOfHour()->toIso8601String(),
        ];
    }

    /**
     * Récupère les derniers journaux d'exécution
     */
    public function getRecentLogs(int $limit = 15)
    {
        return SchedulerLog::with('adminUser:id,name,email')
            ->latest('executed_at')
            ->limit($limit)
            ->get();
    }
}
