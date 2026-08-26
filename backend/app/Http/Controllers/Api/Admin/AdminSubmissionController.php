<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminSubmissionController extends Controller
{
    /**
     * Obtenir la liste des soumissions pour examen par l'administrateur.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending_review');

        $submissions = Submission::with([
            'mission:id,title,reward_amount,campaign_id',
            'contributor:id,name,phone_number,reputation_score',
        ])
        ->where('status', $status)
        ->latest()
        ->get();

        return response()->json([
            'success' => true,
            'message' => 'Liste des soumissions récupérée.',
            'data' => $submissions,
            'errors' => null,
        ], 200);
    }

    /**
     * Approuver une soumission, créditer le paiement séquestre au contributeur et ajuster sa réputation (+2).
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $reviewer = $request->user();

        $submission = Submission::with(['mission', 'contributor'])->find($id);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'Soumission non trouvée.',
                'errors' => null,
            ], 404);
        }

        if ($submission->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Cette soumission a déjà été traitée ou clôturée.',
                'errors' => null,
            ], 422);
        }

        $payoutAmount = $submission->mission->reward_amount;
        $contributor = $submission->contributor;

        DB::transaction(function () use ($submission, $reviewer, $contributor, $payoutAmount) {
            $submission->update([
                'status' => 'approved',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            $submission->mission->update([
                'status' => 'validated',
            ]);

            if ($contributor) {
                $contributor->completed_missions_count = $contributor->completed_missions_count + 1;
                $contributor->reputation_score = min(100, $contributor->reputation_score + 2);
                $contributor->save();
            }

            // Génération de la transaction de rémunération du contributeur
            WalletTransaction::create([
                'user_id' => $contributor ? $contributor->id : $submission->user_id,
                'campaign_id' => $submission->mission->campaign_id,
                'transaction_type' => 'contributor_payout',
                'amount' => $payoutAmount,
                'balance_before' => 0,
                'balance_after' => $payoutAmount,
                'payment_method' => 'system_escrow',
                'payment_reference' => 'PAYOUT-SUB-' . $submission->id . '-' . date('YmdHis'),
                'status' => 'released',
                'metadata' => [
                    'submission_id' => $submission->id,
                    'mission_id' => $submission->mission_id,
                ],
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Soumission approuvée avec succès. Le montant a été crédité au contributeur.',
            'data' => [
                'submission_id' => $submission->id,
                'submission_status' => 'approved',
                'mission_status' => 'validated',
                'payout_amount' => $payoutAmount,
                'contributor_reputation_score' => $contributor ? $contributor->reputation_score : null,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Rejeter une soumission, réinitialiser la mission et appliquer une pénalité de réputation (-5).
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $reviewer = $request->user();

        $submission = Submission::with(['mission', 'contributor'])->find($id);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'Soumission non trouvée.',
                'errors' => null,
            ], 404);
        }

        if ($submission->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Cette soumission a déjà été traitée ou clôturée.',
                'errors' => null,
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => ['required', 'string', 'max:500'],
        ], [
            'rejection_reason.required' => 'Le motif du rejet est obligatoire.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors du rejet.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $reason = $request->input('rejection_reason');
        $contributor = $submission->contributor;

        DB::transaction(function () use ($submission, $reviewer, $reason, $contributor) {
            $submission->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            // Remise de la mission en disponibilité pour un autre contributeur
            $submission->mission->update([
                'status' => 'available',
                'assigned_user_id' => null,
                'assigned_at' => null,
                'expires_at' => null,
            ]);

            // Pénalité de réputation pour preuve invalide / non conforme
            if ($contributor) {
                $contributor->reputation_score = max(0, $contributor->reputation_score - 5);
                $contributor->save();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Soumission rejetée avec succès. La mission a été remise en disponibilité.',
            'data' => [
                'submission_id' => $submission->id,
                'submission_status' => 'rejected',
                'mission_status' => 'available',
                'rejection_reason' => $reason,
                'contributor_reputation_score' => $contributor ? $contributor->reputation_score : null,
            ],
            'errors' => null,
        ], 200);
    }
}
