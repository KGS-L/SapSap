<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminCampaignController extends Controller
{
    /**
     * Obtenir la liste de toutes les campagnes pour modération Admin.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = Campaign::with('company:id,name,email')->withCount('missions')->latest();

        if ($status) {
            $query->where('status', $status);
        }

        $campaigns = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Liste des campagnes pour modération admin récupérée.',
            'data' => $campaigns,
            'errors' => null,
        ], 200);
    }

    /**
     * Approuver une campagne et générer automatiquement les N missions géolocalisées.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée.',
                'errors' => null,
            ], 404);
        }

        if ($campaign->status !== 'pending_approval' && $campaign->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les campagnes réglées et en attente d\'approbation peuvent être approuvées.',
                'errors' => null,
            ], 422);
        }

        $createdMissionsCount = 0;

        DB::transaction(function () use ($campaign, &$createdMissionsCount) {
            $campaign->update([
                'status' => 'active',
            ]);

            // Coordonnées géographiques de référence : Centre de Ouagadougou
            $baseLat = 12.371420;
            $baseLng = -1.519700;

            for ($i = 1; $i <= $campaign->total_missions_requested; $i++) {
                // Dispersion géographique réaliste (environ 1km à 3km autour du centre)
                $latOffset = (mt_rand(-2500, 2500)) / 100000.0;
                $lngOffset = (mt_rand(-2500, 2500)) / 100000.0;

                Mission::create([
                    'campaign_id' => $campaign->id,
                    'title' => $campaign->title . " - Mission #{$i}",
                    'description' => $campaign->description ?? "Mission terrain #{$i} à Ouagadougou",
                    'mission_type' => $campaign->mission_type,
                    'latitude' => round($baseLat + $latOffset, 7),
                    'longitude' => round($baseLng + $lngOffset, 7),
                    'radius_meters' => 100, // 100 mètres de rayon de géofencing
                    'reward_amount' => $campaign->reward_per_mission,
                    'required_photos_count' => $campaign->required_photos_count,
                    'questionnaire_schema' => $campaign->questionnaire_schema,
                    'status' => 'available',
                ]);

                $createdMissionsCount++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Campagne approuvée avec succès. {$createdMissionsCount} missions géolocalisées créées et déployées.",
            'data' => [
                'campaign_id' => $campaign->id,
                'campaign_status' => 'active',
                'missions_created' => $createdMissionsCount,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Rejeter une campagne avec motif d'explication.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::find($id);

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée.',
                'errors' => null,
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => ['required', 'string', 'max:500'],
        ], [
            'rejection_reason.required' => 'Le motif du rejet est obligatoire.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors du rejet de la campagne.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $campaign->update([
            'status' => 'rejected',
            'description' => trim($campaign->description . "\n[MOTIF DE REJET ADMIN] : " . $request->input('rejection_reason')),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campagne rejetée avec succès.',
            'data' => [
                'campaign_id' => $campaign->id,
                'campaign_status' => 'rejected',
                'rejection_reason' => $request->input('rejection_reason'),
            ],
            'errors' => null,
        ], 200);
    }
}
