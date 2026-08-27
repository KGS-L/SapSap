<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SimulatedPaymentDriver implements PaymentDriverInterface
{
    /**
     * Traiter un virement sortant simulé vers Orange Money ou Moov Money
     */
    public function processPayout(int $amount, string $provider, string $phoneNumber, array $metadata = []): array
    {
        $normalizedProvider = strtolower(trim($provider));
        $prefix = match ($normalizedProvider) {
            'orange_money', 'orange' => 'OM-BF',
            'moov_money', 'moov' => 'MOOV-BF',
            'telecel' => 'TEL-BF',
            default => 'MM-BF',
        };

        $simulatedTxId = $prefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        Log::info("SimulatedPaymentDriver: Payout de {$amount} FCFA vers {$phoneNumber} via {$provider}. Réf: {$simulatedTxId}");

        return [
            'success' => true,
            'transaction_id' => $simulatedTxId,
            'provider' => $provider,
            'recipient_phone' => $phoneNumber,
            'amount' => $amount,
            'currency' => 'XOF',
            'fee' => 0, // Gratuit en mode promotionnel / marketplace
            'message' => "Transfert Mobile Money de {$amount} FCFA effectué avec succès vers le {$phoneNumber}.",
            'sms_preview' => "SapSap: Vous avez reçu {$amount} FCFA sur votre compte {$provider} (Réf: {$simulatedTxId}). Nouveau solde disponible mis à jour.",
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Traiter un dépôt / séquestre simulé (paiement de campagne par une entreprise)
     */
    public function processDeposit(int $amount, string $provider, string $phoneNumber, array $metadata = []): array
    {
        $simulatedTxId = 'DEP-BF-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        Log::info("SimulatedPaymentDriver: Dépôt de {$amount} FCFA depuis {$phoneNumber} via {$provider}. Réf: {$simulatedTxId}");

        return [
            'success' => true,
            'transaction_id' => $simulatedTxId,
            'provider' => $provider,
            'amount' => $amount,
            'currency' => 'XOF',
            'status' => 'completed',
            'message' => "Dépôt séquestre de {$amount} FCFA validé.",
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
