<?php

namespace App\Console\Commands;

use App\Services\AutoValidationService;
use Illuminate\Console\Command;

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
        $hours = (int) $this->option('hours');
        $isDryRun = (bool) $this->option('dry-run');

        $this->info("🚀 Lancement du contrôle d'auto-validation (seuil: {$hours}h)...");

        $pendingCount = $autoValidationService->getPendingEligibleCount($hours);
        $this->line("📊 Soumissions éligibles trouvées : {$pendingCount}");

        if ($pendingCount === 0) {
            $this->info("✨ Aucune soumission en attente depuis plus de {$hours}h. Rien à traiter.");
            return Command::SUCCESS;
        }

        if ($isDryRun) {
            $this->warn("⚠️ Mode --dry-run activé : {$pendingCount} soumission(s) auraient été validées. Aucune modification en base.");
            return Command::SUCCESS;
        }

        $result = $autoValidationService->checkAndAutoValidate($hours, 'manual_admin');

        $this->info("✅ Auto-validation terminée avec succès !");
        $this->table(
            ['ID Soumission', 'Contributeur', 'Mission', 'Rémunération', 'Date Soumission'],
            array_map(function ($item) {
                return [
                    $item['submission_id'],
                    $item['contributor_name'],
                    $item['mission_title'],
                    $item['reward'] . ' FCFA',
                    $item['submitted_at'],
                ];
            }, $result['items'])
        );

        $this->line("⏱️ Durée d'exécution : {$result['duration_ms']} ms");
        return Command::SUCCESS;
    }
}
