<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WalletController extends Controller
{
    protected PaymentGatewayInterface $paymentGateway;

    public function __construct(PaymentGatewayInterface $paymentGateway)
    {
        $this->paymentGateway = $paymentGateway;
    }

    /**
     * Consulter le solde disponible et l'historique des transactions du portefeuille.
     */
    public function getBalance(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalEarned = (int) WalletTransaction::where('user_id', $user->id)
            ->where('transaction_type', 'contributor_payout')
            ->where('status', 'released')
            ->sum('amount');

        $totalWithdrawn = (int) WalletTransaction::where('user_id', $user->id)
            ->where('transaction_type', 'withdrawal')
            ->whereIn('status', ['completed', 'pending'])
            ->sum('amount');

        $availableBalance = max(0, $totalEarned - $totalWithdrawn);

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Solde du portefeuille récupéré.',
            'data' => [
                'available_balance' => $availableBalance,
                'total_earned' => $totalEarned,
                'total_withdrawn' => $totalWithdrawn,
                'currency' => 'FCFA',
                'transactions' => $transactions,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Effectuer un retrait des gains vers Orange Money / Moov Money (+226).
     */
    public function withdraw(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'integer', 'min:500'],
            'payment_method' => ['required', 'string', 'in:orange_money,moov_money'],
            'phone_number' => ['required', 'string', 'regex:/^(\+226|00226)?[0567][0-9]{7}$/'],
        ], [
            'amount.required' => 'Le montant du retrait est obligatoire.',
            'amount.min' => 'Le montant minimum de retrait est de 500 FCFA.',
            'payment_method.required' => 'Le moyen de paiement est obligatoire (orange_money ou moov_money).',
            'phone_number.required' => 'Le numéro de téléphone Mobile Money est obligatoire.',
            'phone_number.regex' => 'Numéro de téléphone invalide (format Burkina Faso ex: +22670123456).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation pour la demande de retrait.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $requestedAmount = (int) $request->input('amount');
        $paymentMethod = $request->input('payment_method');
        $phoneNumber = $request->input('phone_number');

        $totalEarned = (int) WalletTransaction::where('user_id', $user->id)
            ->where('transaction_type', 'contributor_payout')
            ->where('status', 'released')
            ->sum('amount');

        $totalWithdrawn = (int) WalletTransaction::where('user_id', $user->id)
            ->where('transaction_type', 'withdrawal')
            ->whereIn('status', ['completed', 'pending'])
            ->sum('amount');

        $availableBalance = max(0, $totalEarned - $totalWithdrawn);

        if ($requestedAmount > $availableBalance) {
            return response()->json([
                'success' => false,
                'message' => "Solde insuffisant pour effectuer ce retrait. Votre solde disponible est de {$availableBalance} FCFA.",
                'errors' => [
                    'requested_amount' => $requestedAmount,
                    'available_balance' => $availableBalance,
                ],
            ], 422);
        }

        // Traitement du transfert Mobile Money via le driver injectable (AD-6)
        $payoutResult = $this->paymentGateway->payout($phoneNumber, $requestedAmount, $paymentMethod, [
            'user_id' => $user->id,
        ]);

        if (!$payoutResult['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Échec du transfert Mobile Money.',
                'errors' => null,
            ], 500);
        }

        $newBalance = $availableBalance - $requestedAmount;
        $transaction = null;

        DB::transaction(function () use ($user, $requestedAmount, $availableBalance, $newBalance, $paymentMethod, $payoutResult, $phoneNumber, &$transaction) {
            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => 'withdrawal',
                'amount' => $requestedAmount,
                'balance_before' => $availableBalance,
                'balance_after' => $newBalance,
                'payment_method' => $paymentMethod,
                'payment_reference' => $payoutResult['reference'],
                'status' => 'completed',
                'metadata' => [
                    'phone_number' => $phoneNumber,
                    'payout_message' => $payoutResult['message'],
                ],
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Retrait de {$requestedAmount} FCFA effectué avec succès vers {$phoneNumber}.",
            'data' => [
                'transaction_id' => $transaction->id,
                'amount_withdrawn' => $requestedAmount,
                'new_available_balance' => $newBalance,
                'payment_reference' => $payoutResult['reference'],
                'status' => 'completed',
            ],
            'errors' => null,
        ], 200);
    }
}
