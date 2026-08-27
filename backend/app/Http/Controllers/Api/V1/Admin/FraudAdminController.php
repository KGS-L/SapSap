<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\FraudAlert;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FraudAdminController extends Controller
{
    /**
     * Liste des alertes de fraude avec filtres et métriques
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');
        $type = $request->query('type', 'all');

        $query = FraudAlert::with([
            'user:id,name,email,phone,reputation_score,is_active',
            'submission:id,mission_id,status,gps_distance_meters,created_at',
            'submission.mission:id,title,location_name'
        ])->latest();

        if ($status !== 'all' && in_array($status, ['pending', 'investigating', 'resolved', 'dismissed'])) {
            $query->where('status', $status);
        }

        if ($type !== 'all' && in_array($type, ['duplicate_image', 'device_sharing', 'gps_spoofing'])) {
            $query->where('alert_type', $type);
        }

        $alerts = $query->get();

        // Métriques pour les KPI cards
        $counts = [
            'total' => FraudAlert::count(),
            'pending' => FraudAlert::where('status', 'pending')->count(),
            'duplicate_images' => FraudAlert::where('alert_type', 'duplicate_image')->count(),
            'device_sharing' => FraudAlert::where('alert_type', 'device_sharing')->count(),
            'resolved' => FraudAlert::where('status', 'resolved')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $alerts,
            'counts' => $counts,
        ], 200);
    }

    /**
     * Détails d'une alerte
     */
    public function show(int $id): JsonResponse
    {
        $alert = FraudAlert::with(['user', 'submission', 'submission.mission', 'resolver'])->find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Alerte introuvable.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $alert
        ], 200);
    }

    /**
     * Résoudre une alerte en appliquant une sanction
     */
    public function resolveAlert(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:account_suspended,score_penalized,warning_issued',
            'note' => 'nullable|string|max:1000',
        ]);

        $alert = FraudAlert::with('user')->find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Alerte introuvable.'
            ], 404);
        }

        $action = $request->input('action');
        $note = $request->input('note', '');

        // Appliquer la sanction sur l'utilisateur
        if ($alert->user) {
            if ($action === 'account_suspended') {
                $alert->user->update(['is_active' => false]);
            } elseif ($action === 'score_penalized') {
                $newScore = max(0, $alert->user->reputation_score - 15);
                $alert->user->update(['reputation_score' => $newScore]);
            }
        }

        $alert->update([
            'status' => 'resolved',
            'resolution_action' => $action,
            'resolution_note' => $note,
            'resolved_by' => $request->user()?->id,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alerte résolue et sanction appliquée avec succès.',
            'data' => $alert
        ], 200);
    }

    /**
     * Classer l'alerte sans suite (fausse alerte)
     */
    public function dismissAlert(Request $request, int $id): JsonResponse
    {
        $alert = FraudAlert::find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Alerte introuvable.'
            ], 404);
        }

        $alert->update([
            'status' => 'dismissed',
            'resolution_action' => 'false_positive',
            'resolution_note' => $request->input('note', 'Fausse alerte classée sans suite par l\'administrateur.'),
            'resolved_by' => $request->user()?->id,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alerte classée sans suite.',
            'data' => $alert
        ], 200);
    }
}
