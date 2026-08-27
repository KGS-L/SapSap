<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CampaignReportController extends Controller
{
    /**
     * Obtenir le rapport détaillé et les statistiques en temps réel d'une campagne.
     */
    public function getReport(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $campaign = Campaign::with([
            'missions.submissions.contributor:id,name,phone_number',
        ])->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée.',
                'errors' => null,
            ], 404);
        }

        // Vérification de l'isolation multi-entreprises (AD-1 & RBAC)
        if (!$user->hasAnyRole(['super-admin', 'validator']) && $campaign->company_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.',
                'errors' => null,
            ], 403);
        }

        $totalMissions = $campaign->missions->count();
        $validatedMissions = $campaign->missions->where('status', 'validated')->count();
        $pendingMissions = $campaign->missions->whereIn('status', ['available', 'assigned', 'submitted'])->count();
        $completionRate = $totalMissions > 0 ? round(($validatedMissions / $totalMissions) * 100, 2) : 0;
        $totalPaidOut = $validatedMissions * $campaign->reward_per_mission;

        return response()->json([
            'success' => true,
            'message' => 'Rapport de campagne récupéré avec succès.',
            'data' => [
                'campaign_id' => $campaign->id,
                'title' => $campaign->title,
                'mission_type' => $campaign->mission_type,
                'status' => $campaign->status,
                'metrics' => [
                    'total_missions_requested' => $campaign->total_missions_requested,
                    'generated_missions_count' => $totalMissions,
                    'validated_missions_count' => $validatedMissions,
                    'pending_missions_count' => $pendingMissions,
                    'completion_rate_percentage' => $completionRate,
                    'reward_per_mission' => $campaign->reward_per_mission,
                    'total_budget_amount' => $campaign->total_budget_amount,
                    'total_paid_out_amount' => $totalPaidOut,
                ],
                'missions' => $campaign->missions,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Exporter l'intégralité des données d'enquête de la campagne au format CSV ou JSON.
     */
    public function exportData(Request $request, int $id)
    {
        $user = $request->user();

        $campaign = Campaign::with([
            'missions.submissions.contributor:id,name,phone_number',
        ])->find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée.',
                'errors' => null,
            ], 404);
        }

        if (!$user->hasAnyRole(['super-admin', 'validator']) && $campaign->company_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.',
                'errors' => null,
            ], 403);
        }

        $format = strtolower($request->query('format', 'json'));

        if ($format === 'csv') {
            $filename = 'campaign_' . $campaign->id . '_export_' . date('Ymd_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($campaign) {
                $file = fopen('php://output', 'w');
                // En-tête BOM UTF-8 pour Excel
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                // En-têtes CSV
                fputcsv($file, [
                    'Mission ID',
                    'Mission Title',
                    'Latitude',
                    'Longitude',
                    'Mission Status',
                    'Reward FCFA',
                    'Contributor Name',
                    'Contributor Phone',
                    'Submission Status',
                    'Distance Meters',
                    'Submission Hash',
                    'Submitted At',
                    'Answers JSON',
                    'Photo URLs',
                ]);

                foreach ($campaign->missions as $mission) {
                    if ($mission->submissions->isEmpty()) {
                        fputcsv($file, [
                            $mission->id,
                            $mission->title,
                            $mission->latitude,
                            $mission->longitude,
                            $mission->status,
                            $mission->reward_amount,
                            'N/A',
                            'N/A',
                            'N/A',
                            'N/A',
                            'N/A',
                            'N/A',
                            '{}',
                            '[]',
                        ]);
                    } else {
                        foreach ($mission->submissions as $submission) {
                            fputcsv($file, [
                                $mission->id,
                                $mission->title,
                                $mission->latitude,
                                $mission->longitude,
                                $mission->status,
                                $mission->reward_amount,
                                $submission->contributor ? $submission->contributor->name : 'Inconnu',
                                $submission->contributor ? $submission->contributor->phone_number : 'N/A',
                                $submission->status,
                                $submission->distance_from_target_meters,
                                $submission->submission_hash,
                                $submission->created_at->toDateTimeString(),
                                json_encode($submission->answers, JSON_UNESCAPED_UNICODE),
                                implode('; ', $submission->photo_urls ?? []),
                            ]);
                        }
                    }
                }

                fclose($file);
            };

            return new StreamedResponse($callback, 200, $headers);
        }

        // Format JSON par défaut
        return response()->json([
            'success' => true,
            'message' => 'Données d\'export de campagne générées.',
            'data' => [
                'campaign' => [
                    'id' => $campaign->id,
                    'title' => $campaign->title,
                    'status' => $campaign->status,
                    'created_at' => $campaign->created_at->toISOString(),
                ],
                'export_format' => 'json',
                'exported_at' => now()->toISOString(),
                'missions' => $campaign->missions,
            ],
            'errors' => null,
        ], 200);
    }
}
