<?php

namespace App\Jobs;

use App\Services\AutoValidationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CheckPendingSubmissionsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Seuil en heures (par défaut 48h selon les spécifications SapSap)
     */
    public int $hoursThreshold;

    /**
     * Create a new job instance.
     */
    public function __construct(int $hoursThreshold = 48)
    {
        $this->hoursThreshold = $hoursThreshold;
    }

    /**
     * Execute the job.
     */
    public function handle(AutoValidationService $autoValidationService): void
    {
        Log::info("CheckPendingSubmissionsJob: Démarrage de l'auto-validation (seuil: {$this->hoursThreshold}h)...");

        $result = $autoValidationService->checkAndAutoValidate(
            $this->hoursThreshold,
            'scheduler'
        );

        Log::info("CheckPendingSubmissionsJob: Terminé avec succès. {$result['processed_count']} soumissions validées.");
    }
}
