<?php

namespace App\Services\Payment;

interface PaymentGatewayInterface
{
    /**
     * Traiter un paiement Mobile Money entrant (deposit/escrow business).
     *
     * @param string $phoneNumber Ex: +22670123456
     * @param int $amount Montant en FCFA
     * @param string $paymentMethod Ex: orange_money, moov_money
     * @param array $metadata
     * @return array { success: bool, reference: string, amount: int, message: string }
     */
    public function processPayment(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array;

    /**
     * Traiter un retrait Mobile Money sortant (payout contributeur).
     *
     * @param string $phoneNumber Ex: +22670123456
     * @param int $amount Montant en FCFA
     * @param string $paymentMethod Ex: orange_money, moov_money
     * @param array $metadata
     * @return array { success: bool, reference: string, amount: int, message: string }
     */
    public function payout(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array;
}
