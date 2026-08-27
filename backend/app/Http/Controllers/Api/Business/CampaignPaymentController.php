<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\WalletTransaction;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CampaignPaymentController extends Controller
{
    /**
     * Effectuer le règlement et la mise en séquestre du budget d'une campagne via Mobile Money.
     */
    public function pay(Request $request, int $id, PaymentGatewayInterface $paymentGateway): JsonResponse
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
                'message' => 'Cette campagne a déjà été réglée ou est en cours de traitement.',
                'errors' => null,
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'payment_method' => ['required', 'string', 'in:orange_money,moov_money'],
            'phone_number' => ['required', 'string', 'regex:/^\+226[0-9]{8}$/'],
        ], [
            'payment_method.in' => 'Le moyen de paiement doit être orange_money ou moov_money.',
            'phone_number.regex' => 'Le numéro doit respecter le format du Burkina Faso (+226XXXXXXXX).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors du paiement.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $paymentMethod = $request->input('payment_method');
        $phoneNumber = $request->input('phone_number');
        $amount = $campaign->total_budget_amount;

        // Traitement de la transaction via la passerelle
        $result = $paymentGateway->processPayment($phoneNumber, $amount, $paymentMethod, [
            'campaign_id' => $campaign->id,
            'company_id' => $user->id,
        ]);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Échec du traitement du paiement Mobile Money.',
                'errors' => null,
            ], 400);
        }

        // Transaction DB atomique pour consigner le dépôt séquestre immuable
        DB::transaction(function () use ($user, $campaign, $amount, $paymentMethod, $result, $phoneNumber) {
            WalletTransaction::create([
                'user_id' => $user->id,
                'campaign_id' => $campaign->id,
                'transaction_type' => 'campaign_escrow_deposit',
                'amount' => $amount,
                'balance_before' => 0,
                'balance_after' => $amount,
                'payment_method' => $paymentMethod,
                'payment_reference' => $result['reference'],
                'status' => 'escrow_locked',
                'metadata' => [
                    'phone_number' => $phoneNumber,
                    'simulated' => true,
                ],
            ]);

            $campaign->update([
                'escrow_balance' => $amount,
                'status' => 'pending_approval',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Paiement simulé effectué et budget séquestré avec succès. La campagne est en attente d\'approbation.',
            'data' => [
                'campaign_id' => $campaign->id,
                'campaign_status' => 'pending_approval',
                'escrow_balance' => $amount,
                'transaction_reference' => $result['reference'],
                'payment_method' => $paymentMethod,
            ],
            'errors' => null,
        ], 200);
    }
}
