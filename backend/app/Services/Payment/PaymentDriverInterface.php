<?php

namespace App\Services\Payment;

interface PaymentDriverInterface
{
    /**
     * Traiter un versement (payout) vers un compte Mobile Money (Orange Money, Moov Money, etc.)
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
