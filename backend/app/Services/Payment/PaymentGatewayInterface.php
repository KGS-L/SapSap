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

    /**
     * Traiter un versement sortant (payout) vers un compte Mobile Money (Orange Money, Moov Money, etc.)
     *
     * @param int $amount Montant en FCFA
     * @param string $provider 'orange_money' | 'moov_money' | 'telecel'
     * @param string $phoneNumber Numéro de téléphone du bénéficiaire
     * @param array $metadata Métadonnées supplémentaires
     * @return array Résultat du transfert { success, transaction_id, message, fee, provider }
     */
    public function processPayout(int $amount, string $provider, string $phoneNumber, array $metadata = []): array;

    /**
     * Traiter un dépôt / séquestre depuis un compte Mobile Money ou carte
     *
     * @param int $amount Montant en FCFA
     * @param string $provider 'orange_money' | 'moov_money' | 'telecel'
     * @param string $phoneNumber Numéro de téléphone payeur
     * @param array $metadata Métadonnées
     * @return array Résultat du dépôt
     */
    public function processDeposit(int $amount, string $provider, string $phoneNumber, array $metadata = []): array;
}

