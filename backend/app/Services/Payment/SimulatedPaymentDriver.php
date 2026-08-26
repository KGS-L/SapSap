<?php

namespace App\Services\Payment;

use Illuminate\Support\Str;

class SimulatedPaymentDriver implements PaymentGatewayInterface
{
    public function processPayment(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array
    {
        $prefix = match ($paymentMethod) {
            'orange_money' => 'TRX-OM',
            'moov_money' => 'TRX-MOOV',
            default => 'TRX-SIM',
        };

        $reference = $prefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        return [
            'success' => true,
            'reference' => $reference,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'message' => 'Paiement simulé effectué avec succès via ' . ucfirst(str_replace('_', ' ', $paymentMethod)),
        ];
    }
}
