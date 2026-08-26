<?php

namespace App\Console\Commands;

use App\Models\Submission;
use App\Models\WalletTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoValidateSubmissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'missions:auto-validate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-valide toutes les soumissions de missions en attente depuis plus de 48 heures';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = now()->subHours(48);

        $pendingSubmissions = Submission::with(['mission', 'contributor'])
            ->where('status', 'pending_review')
            ->where('created_at', '<=', $cutoff)
            ->get();

        $count = $pendingSubmissions->count();

        if ($count === 0) {
            $this->info('Aucune soumission en attente de plus de 48h à auto-valider.');
            return Command::SUCCESS;
        }

        foreach ($pendingSubmissions as $submission) {
            DB::transaction(function () use ($submission) {
                $submission->update([
                    'status' => 'approved',
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]);

                $submission->mission->update([
                    'status' => 'validated',
                ]);

                $contributor = $submission->contributor;
                if ($contributor) {
                    $contributor->completed_missions_count = $contributor->completed_missions_count + 1;
                    $contributor->reputation_score = min(100, $contributor->reputation_score + 2);
                    $contributor->save();
                }

                WalletTransaction::create([
                    'user_id' => $contributor ? $contributor->id : $submission->user_id,
                    'campaign_id' => $submission->mission->campaign_id,
                    'transaction_type' => 'contributor_payout',
                    'amount' => $submission->mission->reward_amount,
                    'balance_before' => 0,
                    'balance_after' => $submission->mission->reward_amount,
                    'payment_method' => 'system_escrow',
                    'payment_reference' => 'AUTO-PAYOUT-SUB-' . $submission->id . '-' . date('YmdHis'),
                    'status' => 'released',
                    'metadata' => [
                        'submission_id' => $submission->id,
                        'auto_validated' => true,
                        'delay_hours' => 48,
                    ],
                ]);
            });
        }

        $this->info("{$count} soumission(s) auto-validée(s) avec succès après le délai de 48h.");
        return Command::SUCCESS;
    }
}
