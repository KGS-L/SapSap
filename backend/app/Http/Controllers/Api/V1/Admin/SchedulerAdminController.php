<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AutoValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchedulerAdminController extends Controller
{
    protected AutoValidationService $autoValidationService;

    public function __construct(AutoValidationService $autoValidationService)
    {
        $this->autoValidationService = $autoValidationService;
    }

    /**
     * Obtenir le statut en temps réel du planificateur et de l'auto-validation à 48h
     */
    public function getStatus(): JsonResponse
    {
        $stats = $this->autoValidationService->getSchedulerStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }

    /**
     * Déclencher manuellement l'exécution du Job d'auto-validation depuis le portail admin
     */
    public function runAutoValidation(Request $request): JsonResponse
    {
        $hoursThreshold = (int) $request->input('hours', 48);
        $adminUserId = $request->user()?->id;

        $result = $this->autoValidationService->checkAndAutoValidate(
            $hoursThreshold,
            'manual_admin',
            $adminUserId
        );

        $message = $result['processed_count'] > 0
            ? "{$result['processed_count']} soumission(s) ont été auto-validées avec succès (seuil {$hoursThreshold}h)."
            : "Aucune soumission en attente depuis plus de {$hoursThreshold}h. Rien à auto-valider.";

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $result,
        ], 200);
    }

    /**
     * Historique des exécutions du Scheduler
     */
    public function getLogs(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 20);
        $logs = $this->autoValidationService->getRecentLogs($limit);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ], 200);
    }
}
