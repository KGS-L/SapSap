<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class WalletController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Consulter l'état du portefeuille (solde disponible, en attente, historique)
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
     * Demander un virement vers Mobile Money (Orange Money / Moov Money)
     */
    public function withdraw(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $request->validate([
            'amount' => 'required|integer|min:1000',
            'provider' => 'required|string|in:orange_money,moov_money,telecel',
            'phone_number' => 'required|string|min:8|max:20',
        ], [
            'amount.required' => 'Le montant du retrait est obligatoire.',
            'amount.min' => 'Le seuil minimal de retrait est de 1 000 FCFA.',
            'provider.in' => 'Opérateur de paiement non supporté (choisir Orange Money ou Moov Money).',
            'phone_number.required' => 'Le numéro de téléphone Mobile Money est obligatoire.',
        ]);

        try {
            $amount = (int) $request->input('amount');
            $provider = (string) $request->input('provider');
            $phoneNumber = (string) $request->input('phone_number');

            $result = $this->walletService->requestWithdrawal($user, $amount, $provider, $phoneNumber);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Une erreur est survenue lors du traitement du virement Mobile Money.",
            ], 500);
        }
    }

    /**
     * Historique des transactions du portefeuille
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
