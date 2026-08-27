<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignAdminController extends Controller
{
    /**
     * Liste des campagnes pour la modération
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');

        $query = Campaign::with('user:id,name,email,phone')->latest();

        if ($status !== 'all' && in_array($status, ['pending', 'active', 'rejected', 'completed', 'draft'])) {
            $query->where('status', $status);
        }

        $campaigns = $query->get();

        // Calcul des métriques pour les badges
        $counts = [
            'total' => Campaign::count(),
            'pending' => Campaign::where('status', 'pending')->count(),
            'active' => Campaign::where('status', 'active')->count(),
            'rejected' => Campaign::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $campaigns,
            'counts' => $counts,
        ], 200);
    }

    /**
     * Détails d'une campagne
     */
    public function show(int $id): JsonResponse
    {
        $campaign = Campaign::with(['user', 'missions'])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $campaign
        ], 200);
    }

    /**
     * Approuver une campagne et la publier sur la marketplace
     */
    public function approve(int $id): JsonResponse
    {
        $campaign = Campaign::find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $campaign->update([
            'status' => 'active',
            'approved_at' => now(),
            'rejection_reason' => null,
            'rejected_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campagne approuvée avec succès et publiée sur la marketplace.',
            'data' => $campaign
        ], 200);
    }

    /**
     * Rejeter une campagne avec motif obligatoire
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ], [
            'reason.required' => 'Le motif du rejet est obligatoire pour expliciter le refus à l\'entreprise.',
            'reason.min' => 'Le motif doit comporter au moins 5 caractères.',
        ]);

        $campaign = Campaign::find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $campaign->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('reason'),
            'rejected_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campagne rejetée. Le motif a été consigné pour l\'entreprise.',
            'data' => $campaign
        ], 200);
    }
}
