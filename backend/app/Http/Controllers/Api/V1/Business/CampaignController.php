<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    /**
     * Liste des campagnes de l'entreprise connectée.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('super-admin')) {
            $campaigns = Campaign::with('company:id,name,email')->latest()->get();
        } else {
            $campaigns = Campaign::where('company_id', $user->id)->latest()->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Liste des campagnes récupérée avec succès.',
            'data' => $campaigns,
            'errors' => null,
        ], 200);
    }

    /**
     * Création d'une nouvelle campagne (Wizard Step 1 & 2 - Statut Draft).
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'mission_type' => ['required', 'string', 'in:verification,audit,mystery_shopper,pricing'],
            'location_city' => ['nullable', 'string', 'max:150'],
            'target_district' => ['nullable', 'string', 'max:150'],
            'questionnaire_schema' => ['nullable', 'array'],
            'required_photos_count' => ['required', 'integer', 'min:1', 'max:10'],
            'total_missions_requested' => ['required', 'integer', 'min:1'],
            'reward_per_mission' => ['required', 'integer', 'min:500'],
        ], [
            'title.required' => 'Le titre de la campagne est obligatoire.',
            'mission_type.in' => 'Le type de mission sélectionné est invalide.',
            'reward_per_mission.min' => 'La récompense par mission doit être d\'au moins 500 FCFA.',
            'total_missions_requested.min' => 'Le nombre de missions doit être d\'au moins 1.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors de la création de la campagne.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $reward = (int) $request->input('reward_per_mission');
        $count = (int) $request->input('total_missions_requested');

        $subtotal = $reward * $count;
        $platformFee = (int) round($subtotal * 0.15); // 15% commission SapSap
        $totalBudget = $subtotal + $platformFee;

        $campaign = Campaign::create([
            'company_id' => $request->user()->id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'mission_type' => $request->input('mission_type'),
            'location_city' => $request->input('location_city', 'Ouagadougou'),
            'target_district' => $request->input('target_district'),
            'questionnaire_schema' => $request->input('questionnaire_schema', []),
            'required_photos_count' => (int) $request->input('required_photos_count', 1),
            'total_missions_requested' => $count,
            'reward_per_mission' => $reward,
            'subtotal_amount' => $subtotal,
            'platform_fee_amount' => $platformFee,
            'total_budget_amount' => $totalBudget,
            'escrow_balance' => 0,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campagne créée en brouillon avec succès.',
            'data' => $campaign,
            'errors' => null,
        ], 201);
    }

    /**
     * Afficher les détails d'une campagne spécifique.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $query = Campaign::query();
        if (!$user->hasRole('super-admin')) {
            $query->where('company_id', $user->id);
        }

        $campaign = $query->where('id', $id)->first();

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée ou accès non autorisé.',
                'errors' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Détails de la campagne récupérés.',
            'data' => $campaign,
            'errors' => null,
        ], 200);
    }

    /**
     * Mettre à jour une campagne en brouillon.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $query = Campaign::query();
        if (!$user->hasRole('super-admin')) {
            $query->where('company_id', $user->id);
        }

        $campaign = $query->where('id', $id)->first();

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée ou accès non autorisé.',
                'errors' => null,
            ], 404);
        }

        if ($campaign->status !== 'draft' && $campaign->status !== 'pending_payment') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier une campagne déjà soumise ou active.',
                'errors' => null,
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'mission_type' => ['sometimes', 'string', 'in:verification,audit,mystery_shopper,pricing'],
            'location_city' => ['nullable', 'string', 'max:150'],
            'target_district' => ['nullable', 'string', 'max:150'],
            'questionnaire_schema' => ['nullable', 'array'],
            'required_photos_count' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'total_missions_requested' => ['sometimes', 'integer', 'min:1'],
            'reward_per_mission' => ['sometimes', 'integer', 'min:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors de la mise à jour de la campagne.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $campaign->fill($request->only([
            'title', 'description', 'mission_type', 'location_city', 'target_district',
            'questionnaire_schema', 'required_photos_count'
        ]));

        if ($request->has('reward_per_mission') || $request->has('total_missions_requested')) {
            $reward = (int) $request->input('reward_per_mission', $campaign->reward_per_mission);
            $count = (int) $request->input('total_missions_requested', $campaign->total_missions_requested);

            $subtotal = $reward * $count;
            $platformFee = (int) round($subtotal * 0.15);
            $totalBudget = $subtotal + $platformFee;

            $campaign->reward_per_mission = $reward;
            $campaign->total_missions_requested = $count;
            $campaign->subtotal_amount = $subtotal;
            $campaign->platform_fee_amount = $platformFee;
            $campaign->total_budget_amount = $totalBudget;
        }

        $campaign->save();

        return response()->json([
            'success' => true,
            'message' => 'Campagne mise à jour avec succès.',
            'data' => $campaign,
            'errors' => null,
        ], 200);
    }
}
