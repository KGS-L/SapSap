<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionAdminController extends Controller
{
    /**
     * Liste des soumissions pour examen par les validateurs
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');

        $query = Submission::with([
            'user:id,name,email,phone,reputation_score',
            'mission:id,campaign_id,title,location_name,reward,latitude,longitude',
            'mission.campaign:id,title,company_name,type,city'
        ])->latest();

        if ($status !== 'all' && in_array($status, ['submitted', 'validated', 'rejected', 'fraud_suspect'])) {
            $query->where('status', $status);
        }

        $submissions = $query->get();

        // Calcul des métriques de badge
        $counts = [
            'total' => Submission::count(),
            'submitted' => Submission::where('status', 'submitted')->count(),
            'validated' => Submission::where('status', 'validated')->count(),
            'rejected' => Submission::where('status', 'rejected')->count(),
            'fraud_suspect' => Submission::where('status', 'fraud_suspect')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $submissions,
            'counts' => $counts,
        ], 200);
    }

    /**
     * Détails complets d'une soumission
     */
    public function show(int $id): JsonResponse
    {
        $submission = Submission::with([
            'user',
            'mission',
            'mission.campaign'
        ])->find($id);

        if (! $submission) {
            return response()->json([
                'success' => false,
                'message' => 'Soumission introuvable.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $submission
        ], 200);
    }

    /**
     * Valider manuellement la soumission et créditer le contributeur
     */
    public function validateSubmission(int $id): JsonResponse
    {
        $submission = Submission::with('mission', 'user')->find($id);

        if (! $submission) {
            return response()->json([
                'success' => false,
                'message' => 'Soumission introuvable.'
            ], 404);
        }

        if ($submission->status === 'validated') {
            return response()->json([
                'success' => false,
                'message' => 'Cette soumission a déjà été validée.'
            ], 422);
        }

        $submission->update([
            'status' => 'validated',
            'validated_at' => now(),
            'rejection_reason' => null,
            'rejected_at' => null,
        ]);

        if ($submission->mission) {
            $submission->mission->update(['status' => 'validated']);
        }

        // Incrémenter le score de réputation du contributeur (+2 points, max 100)
        if ($submission->user && $submission->user->reputation_score < 100) {
            $submission->user->increment('reputation_score', min(2, 100 - $submission->user->reputation_score));
        }

        return response()->json([
            'success' => true,
            'message' => 'Prestation validée avec succès. La rémunération et le score du contributeur ont été mis à jour.',
            'data' => $submission
        ], 200);
    }

    /**
     * Rejeter la soumission avec motif explicatif
     */
    public function rejectSubmission(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ], [
            'reason.required' => 'Le motif du refus est obligatoire pour informer le contributeur.',
            'reason.min' => 'Le motif doit comporter au moins 5 caractères.',
        ]);

        $submission = Submission::with('mission')->find($id);

        if (! $submission) {
            return response()->json([
                'success' => false,
                'message' => 'Soumission introuvable.'
            ], 404);
        }

        $submission->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('reason'),
            'rejected_at' => now(),
        ]);

        if ($submission->mission) {
            // Remettre la mission disponible pour un autre contributeur
            $submission->mission->update(['status' => 'available', 'assigned_user_id' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Soumission rejetée. Le motif a été transmis au contributeur.',
            'data' => $submission
        ], 200);
    }
}
