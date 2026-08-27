<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceAdminController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Obtenir la synthèse financière globale (Gains totaux, Retraits Mobile Money, Répartition)
     */
    public function getStats(): JsonResponse
    {
        $stats = $this->walletService->getGlobalFinanceStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }

    /**
     * Liste des demandes de retraits Mobile Money
     */
    public function getWithdrawals(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $withdrawals = $this->walletService->getAllWithdrawalRequests($limit);

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ], 200);
    }

    /**
     * Grand Livre Comptable Général (Audit des flux financiers)
     */
    public function getLedger(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $ledger = $this->walletService->getGeneralLedger($limit);

        return response()->json([
            'success' => true,
            'data' => $ledger,
        ], 200);
    }
}
