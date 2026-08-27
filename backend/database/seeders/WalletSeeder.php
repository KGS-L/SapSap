<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $moussa = User::where('email', 'moussa@sapsap.bf')->first();
        $amina = User::where('email', 'amina@sapsap.bf')->first();
        $ibrahim = User::where('email', 'ibrahim@sapsap.bf')->first();

        // 1. Portefeuille Moussa Ouédraogo
        if ($moussa) {
            $wMoussa = Wallet::firstOrCreate(
                ['user_id' => $moussa->id],
                [
                    'pending_balance' => 3000,
                    'available_balance' => 8500,
                    'total_earned' => 13500,
                ]
            );

            // Transactions passées
            WalletTransaction::firstOrCreate(
                ['reference' => 'TXN-20260825-001001'],
                [
                    'wallet_id' => $wMoussa->id,
                    'user_id' => $moussa->id,
                    'type' => 'mission_earning',
                    'amount' => 3000,
                    'balance_before' => 0,
                    'balance_after' => 3000,
                    'status' => 'completed',
                    'metadata' => ['mission_title' => 'Audit Maquis Kiosque #1 (Patte d\'Oie)'],
                    'created_at' => now()->subDays(2),
                ]
            );

            WalletTransaction::firstOrCreate(
                ['reference' => 'TXN-20260826-001002'],
                [
                    'wallet_id' => $wMoussa->id,
                    'user_id' => $moussa->id,
                    'type' => 'withdrawal_debit',
                    'amount' => -5000,
                    'balance_before' => 13500,
                    'balance_after' => 8500,
                    'status' => 'completed',
                    'metadata' => ['provider' => 'orange_money', 'phone_number' => $moussa->phone],
                    'created_at' => now()->subHours(12),
                ]
            );

            WithdrawalRequest::firstOrCreate(
                ['reference' => 'WTH-20260826-001'],
                [
                    'user_id' => $moussa->id,
                    'wallet_id' => $wMoussa->id,
                    'amount' => 5000,
                    'provider' => 'orange_money',
                    'phone_number' => $moussa->phone ?? '+226 70 12 34 56',
                    'status' => 'completed',
                    'simulated_payout_id' => 'OM-BF-20260826-9812A',
                    'processed_at' => now()->subHours(12),
                ]
            );
        }

        // 2. Portefeuille Amina Sawadogo
        if ($amina) {
            $wAmina = Wallet::firstOrCreate(
                ['user_id' => $amina->id],
                [
                    'pending_balance' => 2500,
                    'available_balance' => 14000,
                    'total_earned' => 17000,
                ]
            );

            WalletTransaction::firstOrCreate(
                ['reference' => 'TXN-20260826-002001'],
                [
                    'wallet_id' => $wAmina->id,
                    'user_id' => $amina->id,
                    'type' => 'withdrawal_debit',
                    'amount' => -3000,
                    'balance_before' => 17000,
                    'balance_after' => 14000,
                    'status' => 'completed',
                    'metadata' => ['provider' => 'moov_money', 'phone_number' => $amina->phone],
                    'created_at' => now()->subHours(6),
                ]
            );

            WithdrawalRequest::firstOrCreate(
                ['reference' => 'WTH-20260826-002'],
                [
                    'user_id' => $amina->id,
                    'wallet_id' => $wAmina->id,
                    'amount' => 3000,
                    'provider' => 'moov_money',
                    'phone_number' => $amina->phone ?? '+226 76 98 76 54',
                    'status' => 'completed',
                    'simulated_payout_id' => 'MOOV-BF-20260826-4412B',
                    'processed_at' => now()->subHours(6),
                ]
            );
        }

        // 3. Portefeuille Ibrahim Kaboré
        if ($ibrahim) {
            Wallet::firstOrCreate(
                ['user_id' => $ibrahim->id],
                [
                    'pending_balance' => 3000,
                    'available_balance' => 1500,
                    'total_earned' => 1500,
                ]
            );
        }
    }
}
