<?php

namespace App\Services;

use App\Models\Submission;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Services\Payment\PaymentDriverInterface;
use App\Services\Payment\SimulatedPaymentDriver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;

class WalletService
{
    protected PaymentDriverInterface $paymentDriver;

    public function __construct(?PaymentDriverInterface $paymentDriver = null)
    {
        $this->paymentDriver = $paymentDriver ?? new SimulatedPaymentDriver();
    }

    /**
     * Récupérer ou créer le portefeuille financier d'un utilisateur
     */
    public function getOrCreateWallet(User $user): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $user->id],
            [
                'pending_balance' => 0,
                'available_balance' => 0,
                'total_earned' => 0,
            ]
        );
    }

    /**
     * Créditer les gains d'une mission validée (manuelle ou auto-validée 48h)
     */
    public function creditMissionEarning(Submission $submission): WalletTransaction
    {
        $reward = (int) ($submission->mission?->reward ?? 0);
        $user = $submission->user;

        if (! $user || $reward <= 0) {
            throw new InvalidArgumentException("Soumission ou utilisateur invalide pour le versement des gains.");
        }

        return DB::transaction(function () use ($user, $submission, $reward) {
            $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();
            if (! $wallet) {
                $wallet = $this->getOrCreateWallet($user);
            }

            $balanceBefore = $wallet->available_balance;
            $balanceAfter = $balanceBefore + $reward;

            // Mise à jour du solde du portefeuille
            $wallet->update([
                'available_balance' => $balanceAfter,
                'total_earned' => $wallet->total_earned + $reward,
            ]);

            $reference = 'TXN-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Enregistrement dans le grand livre immuable
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'mission_earning',
                'amount' => $reward,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => $reference,
                'metadata' => [
                    'submission_id' => $submission->id,
                    'mission_id' => $submission->mission_id,
                    'mission_title' => $submission->mission?->title,
                    'campaign_id' => $submission->mission?->campaign_id,
                    'auto_validated' => ! is_null($submission->auto_validated_at),
                ],
            ]);

            Log::info("WalletService: Crédit mission #{$submission->mission_id} (+{$reward} FCFA) sur le wallet de {$user->name}. Solde: {$balanceBefore} -> {$balanceAfter} FCFA.");

            return $transaction;
        });
    }

    /**
     * Demande de retrait vers Mobile Money (Orange Money / Moov Money)
     * Règle d'invariance : Montant minimum >= 1 000 FCFA
     */
    public function requestWithdrawal(
        User $user,
        int $amount,
        string $provider,
        string $phoneNumber
    ): array {
        if ($amount < 1000) {
            throw new InvalidArgumentException("Le seuil minimal de retrait est de 1 000 FCFA.");
        }

        return DB::transaction(function () use ($user, $amount, $provider, $phoneNumber) {
            $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();
            if (! $wallet) {
                $wallet = $this->getOrCreateWallet($user);
            }

            if ($wallet->available_balance < $amount) {
                throw new InvalidArgumentException("Solde disponible insuffisant ({$wallet->available_balance} FCFA disponibles).");
            }

            $balanceBefore = $wallet->available_balance;
            $balanceAfter = $balanceBefore - $amount;

            // Décrémenter le solde disponible
            $wallet->update([
                'available_balance' => $balanceAfter,
            ]);

            $withdrawalRef = 'WTH-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $txnRef = 'TXN-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Appel du driver de paiement simulé Mobile Money
            $payoutResult = $this->paymentDriver->processPayout(
                $amount,
                $provider,
                $phoneNumber,
                ['withdrawal_reference' => $withdrawalRef, 'user_id' => $user->id]
            );

            // Enregistrement de la demande de retrait
            $withdrawal = WithdrawalRequest::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'reference' => $withdrawalRef,
                'amount' => $amount,
                'provider' => $provider,
                'phone_number' => $phoneNumber,
                'status' => 'completed',
                'simulated_payout_id' => $payoutResult['transaction_id'] ?? null,
                'processed_at' => now(),
            ]);

            // Inscription au registre comptable immuable
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'withdrawal_debit',
                'amount' => -1 * $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => $txnRef,
                'metadata' => [
                    'withdrawal_id' => $withdrawal->id,
                    'withdrawal_reference' => $withdrawalRef,
                    'provider' => $provider,
                    'phone_number' => $phoneNumber,
                    'payout_transaction_id' => $payoutResult['transaction_id'] ?? null,
                ],
            ]);

            Log::info("WalletService: Retrait de {$amount} FCFA validé pour {$user->name} via {$provider} ({$phoneNumber}). Réf: {$withdrawalRef}");

            return [
                'success' => true,
                'message' => "Retrait de {$amount} FCFA vers votre compte {$provider} effectué avec succès.",
                'withdrawal' => $withdrawal,
                'transaction' => $transaction,
                'payout' => $payoutResult,
                'wallet' => [
                    'available_balance' => $wallet->available_balance,
                    'total_earned' => $wallet->total_earned,
                ],
            ];
        });
    }

    /**
     * Obtenir la synthèse financière d'un utilisateur
     */
    public function getWalletOverview(User $user): array
    {
        $wallet = $this->getOrCreateWallet($user);
        $recentTransactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();
        $recentWithdrawals = WithdrawalRequest::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get();

        return [
            'wallet' => $wallet,
            'recent_transactions' => $recentTransactions,
            'recent_withdrawals' => $recentWithdrawals,
            'min_withdrawal_threshold' => 1000,
        ];
    }

    /**
     * Statistiques globales pour la supervision administrative des flux financiers
     */
    public function getGlobalFinanceStats(): array
    {
        $totalEarnedAll = (int) Wallet::sum('total_earned');
        $totalAvailableAll = (int) Wallet::sum('available_balance');
        $totalWithdrawn = (int) WithdrawalRequest::where('status', 'completed')->sum('amount');
        $totalWithdrawalsCount = WithdrawalRequest::where('status', 'completed')->count();

        // Répartition par opérateur Mobile Money
        $orangeMoneyTotal = (int) WithdrawalRequest::where('status', 'completed')
            ->where('provider', 'orange_money')
            ->sum('amount');

        $moovMoneyTotal = (int) WithdrawalRequest::where('status', 'completed')
            ->where('provider', 'moov_money')
            ->sum('amount');

        return [
            'total_earned_all' => $totalEarnedAll,
            'total_available_all' => $totalAvailableAll,
            'total_withdrawn' => $totalWithdrawn,
            'total_withdrawals_count' => $totalWithdrawalsCount,
            'orange_money_volume' => $orangeMoneyTotal,
            'moov_money_volume' => $moovMoneyTotal,
            'active_wallets_count' => Wallet::count(),
            'currency' => 'FCFA',
        ];
    }

    /**
     * Liste des demandes de retrait pour les administrateurs
     */
    public function getAllWithdrawalRequests(int $limit = 50)
    {
        return WithdrawalRequest::with('user:id,name,email,phone,reputation_score')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Consultation du Grand Livre Comptable immuable
     */
    public function getGeneralLedger(int $limit = 50)
    {
        return WalletTransaction::with('user:id,name,email')
            ->latest()
            ->limit($limit)
            ->get();
    }
}
