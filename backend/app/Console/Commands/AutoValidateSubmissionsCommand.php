<?php

namespace App\Console\Commands;

use App\Models\Submission;
use App\Models\WalletTransaction;
use App\Services\AutoValidationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoValidateSubmissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'submissions:auto-validate 
                            {--hours=48 : Seuil en heures d\'attente avant auto-validation}
                            {--dry-run : Exécute sans persister les modifications}';

    /**
     * The console command aliases.
     *
     * @var array<string>
     */
    protected $aliases = ['missions:auto-validate'];

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Valide automatiquement les soumissions de missions en attente depuis plus de 48h';

    /**
     * Execute the console command.
     */
    public function handle(AutoValidationService $autoValidationService): int
    {
        $hours = (int) ($this->option('hours') ?? 48);
        $isDryRun = (bool) $this->option('dry-run');

        $this->info("🚀 Lancement du contrôle d'auto-validation (seuil: {$hours}h)...");

        $cutoff = now()->subHours($hours);

        $pendingSubmissions = Submission::with(['mission', 'user', 'contributor'])
            ->whereIn('status', ['pending_review', 'submitted'])
            ->where('created_at', '<=', $cutoff)
            ->get();

        $pendingCount = $pendingSubmissions->count();
        $this->line("📊 Soumissions éligibles trouvées : {$pendingCount}");

        if ($pendingCount === 0) {
            $this->info("✨ Aucune soumission en attente depuis plus de {$hours}h. Rien à traiter.");
            return Command::SUCCESS;
        }

        if ($isDryRun) {
            $this->warn("⚠️ Mode --dry-run activé : {$pendingCount} soumission(s) auraient été validées. Aucune modification en base.");
            return Command::SUCCESS;
        }

        $processedItems = [];

        foreach ($pendingSubmissions as $submission) {
            DB::transaction(function () use ($submission, $hours, &$processedItems) {
                $now = now();
                $submission->update([
                    'status' => 'approved',
                    'validated_at' => $now,
                    'auto_validated_at' => $now,
                    'reviewed_at' => $now,
                    'rejection_reason' => null,
                    'rejected_at' => null,
                ]);

                if ($submission->mission) {
                    $submission->mission->update([
                        'status' => 'validated',
                    ]);
                }

                $contributor = $submission->contributor ?? $submission->user;
                if ($contributor) {
                    $contributor->completed_missions_count = ($contributor->completed_missions_count ?? 0) + 1;
                    $contributor->reputation_score = min(100, ($contributor->reputation_score ?? 100) + 2);
                    $contributor->save();
                }

                $rewardAmount = $submission->mission?->reward_amount ?? $submission->mission?->reward ?? 0;
                $campaignId = $submission->mission?->campaign_id;
                $userId = $contributor ? $contributor->id : $submission->user_id;

                WalletTransaction::create([
                    'user_id' => $userId,
                    'campaign_id' => $campaignId,
                    'transaction_type' => 'contributor_payout',
                    'type' => 'mission_credit',
                    'amount' => $rewardAmount,
                    'balance_before' => 0,
                    'balance_after' => $rewardAmount,
                    'payment_method' => 'system_escrow',
                    'payment_reference' => 'AUTO-PAYOUT-SUB-' . $submission->id . '-' . date('YmdHis'),
                    'status' => 'released',
                    'metadata' => [
                        'submission_id' => $submission->id,
                        'auto_validated' => true,
                        'delay_hours' => $hours,
                    ],
                ]);

                $processedItems[] = [
                    'submission_id' => $submission->id,
                    'contributor_name' => $contributor?->name ?? 'Contributeur',
                    'mission_title' => $submission->mission?->title ?? 'Mission',
                    'reward' => $rewardAmount . ' FCFA',
                    'submitted_at' => $submission->created_at->toIso8601String(),
                ];
            });
        }

        $this->info("✅ {$pendingCount} soumission(s) auto-validée(s) avec succès après le délai de {$hours}h.");

        if (!empty($processedItems)) {
            $this->table(
                ['ID Soumission', 'Contributeur', 'Mission', 'Rémunération', 'Date Soumission'],
                $processedItems
            );
        }

        return Command::SUCCESS;
    }
}
