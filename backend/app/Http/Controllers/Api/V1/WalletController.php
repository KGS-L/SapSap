<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class WalletController extends Controller
{
    protected WalletService $walletService;
    protected ?PaymentGatewayInterface $paymentGateway;

    public function __construct(WalletService $walletService, ?PaymentGatewayInterface $paymentGateway = null)
    {
        $this->walletService = $walletService;
        $this->paymentGateway = $paymentGateway ?? app()->make(PaymentGatewayInterface::class);
    }

    /**
     * Consulter le solde disponible et l'historique des transactions du portefeuille (Format Mobile).
     */
    public function getBalance(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalEarned = (int) WalletTransaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('transaction_type', 'contributor_payout')
                    ->where('status', 'released')
                    ->orWhere(function ($q2) {
                        $q2->where('type', 'mission_earning')->where('status', 'completed');
                    });
            })
            ->sum('amount');

        $totalWithdrawn = (int) WalletTransaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('transaction_type', 'withdrawal')
                    ->whereIn('status', ['completed', 'pending'])
                    ->orWhere(function ($q2) {
                        $q2->where('type', 'withdrawal')->whereIn('status', ['completed', 'pending']);
                    });
            })
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
     * Consulter l'état du portefeuille (solde disponible, en attente, historique) - Format Web.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $overview = $this->walletService->getWalletOverview($user);

        return response()->json([
            'success' => true,
            'data' => $overview,
        ], 200);
    }

    /**
     * Effectuer ou demander un retrait des gains vers Orange Money / Moov Money (+226).
     */
    public function withdraw(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        // Harmoniser le provider/payment_method
        $paymentMethod = $request->input('payment_method') ?? $request->input('provider');
        $amount = $request->input('amount');
        $phoneNumber = $request->input('phone_number');

        $validator = Validator::make([
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'phone_number' => $phoneNumber,
        ], [
            'amount' => ['required', 'integer', 'min:500'],
            'payment_method' => ['required', 'string', 'in:orange_money,moov_money,telecel'],
            'phone_number' => ['required', 'string'],
        ], [
            'amount.required' => 'Le montant du retrait est obligatoire.',
            'amount.min' => 'Le montant minimum de retrait est de 500 FCFA.',
            'payment_method.required' => 'Le moyen de paiement est obligatoire (orange_money ou moov_money).',
            'payment_method.in' => 'Opérateur de paiement non supporté (choisir Orange Money ou Moov Money).',
            'phone_number.required' => 'Le numéro de téléphone Mobile Money est obligatoire.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation pour la demande de retrait.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $requestedAmount = (int) $amount;

        // Calcul du solde disponible
        $totalEarned = (int) WalletTransaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('transaction_type', 'contributor_payout')
                    ->where('status', 'released')
                    ->orWhere(function ($q2) {
                        $q2->where('type', 'mission_earning')->where('status', 'completed');
                    });
            })
            ->sum('amount');

        $totalWithdrawn = (int) WalletTransaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('transaction_type', 'withdrawal')
                    ->whereIn('status', ['completed', 'pending'])
                    ->orWhere(function ($q2) {
                        $q2->where('type', 'withdrawal')->whereIn('status', ['completed', 'pending']);
                    });
            })
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

        // Traitement du transfert Mobile Money via le gateway
        $payoutResult = $this->paymentGateway->payout($phoneNumber, $requestedAmount, $paymentMethod, [
            'user_id' => $user->id,
        ]);

        if (! ($payoutResult['success'] ?? false)) {
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
                'type' => 'withdrawal',
                'amount' => $requestedAmount,
                'balance_before' => $availableBalance,
                'balance_after' => $newBalance,
                'payment_method' => $paymentMethod,
                'payment_reference' => $payoutResult['reference'] ?? 'TXN-' . time(),
                'status' => 'completed',
                'metadata' => [
                    'phone_number' => $phoneNumber,
                    'payout_message' => $payoutResult['message'] ?? 'Payout completed',
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
                'payment_reference' => $payoutResult['reference'] ?? '',
                'status' => 'completed',
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Historique paginé des transactions du portefeuille
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $transactions = $user->walletTransactions()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ], 200);
    }
}
