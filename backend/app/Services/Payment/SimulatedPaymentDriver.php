<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SimulatedPaymentDriver implements PaymentGatewayInterface
{
    /**
     * Effectuer un paiement simulé pour le lancement d'une campagne
     */
    public function processPayment(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array
    {
        $prefix = match ($paymentMethod) {
            'orange_money', 'orange' => 'TRX-OM',
            'moov_money', 'moov' => 'TRX-MOOV',
            default => 'TRX-SIM',
        };

        $reference = $prefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        Log::info("SimulatedPaymentDriver: Paiement de {$amount} FCFA depuis {$phoneNumber} via {$paymentMethod}. Réf: {$reference}");

        return [
            'success' => true,
            'reference' => $reference,
            'transaction_id' => $reference,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'message' => 'Paiement simulé effectué avec succès via ' . ucfirst(str_replace('_', ' ', $paymentMethod)),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Effectuer un virement / retrait Mobile Money vers un contributeur
     */
    public function payout(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array
    {
        $prefix = match ($paymentMethod) {
            'orange_money', 'orange' => 'POUT-OM',
            'moov_money', 'moov' => 'POUT-MOOV',
            default => 'POUT-SIM',
        };

        $reference = $prefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        Log::info("SimulatedPaymentDriver: Payout de {$amount} FCFA vers {$phoneNumber} via {$paymentMethod}. Réf: {$reference}");

        return [
            'success' => true,
            'reference' => $reference,
            'transaction_id' => $reference,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'message' => 'Transfert Mobile Money de ' . number_format($amount, 0, ',', ' ') . ' FCFA effectué vers le numéro ' . $phoneNumber,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Traiter un virement sortant simulé (PaymentGatewayInterface)
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
            'reference' => $simulatedTxId,
            'provider' => $provider,
            'recipient_phone' => $phoneNumber,
            'amount' => $amount,
            'currency' => 'XOF',
            'fee' => 0,
            'message' => "Transfert Mobile Money de {$amount} FCFA effectué avec succès vers le {$phoneNumber}.",
            'sms_preview' => "SapSap: Vous avez reçu {$amount} FCFA sur votre compte {$provider} (Réf: {$simulatedTxId}). Nouveau solde disponible mis à jour.",
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Traiter un dépôt / séquestre simulé (PaymentGatewayInterface)
     */
    public function processDeposit(int $amount, string $provider, string $phoneNumber, array $metadata = []): array
    {
        $simulatedTxId = 'DEP-BF-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        Log::info("SimulatedPaymentDriver: Dépôt de {$amount} FCFA depuis {$phoneNumber} via {$provider}. Réf: {$simulatedTxId}");

        return [
            'success' => true,
            'transaction_id' => $simulatedTxId,
            'reference' => $simulatedTxId,
            'provider' => $provider,
            'amount' => $amount,
            'currency' => 'XOF',
            'status' => 'completed',
            'message' => "Dépôt séquestre de {$amount} FCFA validé.",
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
