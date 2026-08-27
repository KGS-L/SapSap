<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\User;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessUser = User::where('email', 'business@sobbra.bf')->first() ?? User::first();

        if (! $businessUser) {
            return;
        }

        // 1. Campagne en attente 1 : Audit PLV Sobbra
        $camp1 = Campaign::firstOrCreate(
            ['title' => 'Audit Présence PLV Boissons Sobbra'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Sobbra Distribution BF',
                'description' => 'Contrôle visuel des affiches et de la mise en avant des produits Sobbra dans les maquis et débits de boisson.',
                'type' => 'Audit & Présence',
                'city' => 'Ouagadougou',
                'target_neighborhoods' => 'Patte d\'Oie, Dassasgho, Gounghin, Tampouy',
                'criteria' => 'Photo façade + Photo rayon/frigo + Questionnaire 4 questions',
                'missions_count' => 150,
                'reward_per_mission' => 3000,
                'total_budget' => 450000,
                'status' => 'pending',
            ]
        );

        // Missions associées
        for ($i = 1; $i <= 3; $i++) {
            Mission::firstOrCreate(
                ['campaign_id' => $camp1->id, 'title' => "Audit Maquis Kiosque #$i (Secteur " . ($i * 5) . ")"],
                [
                    'location_name' => "Secteur " . ($i * 5) . ", Ouagadougou",
                    'latitude' => 12.3714 + ($i * 0.005),
                    'longitude' => -1.5197 + ($i * 0.005),
                    'reward' => 3000,
                    'status' => 'available',
                ]
            );
        }

        // 2. Campagne en attente 2 : Relevé Carburant
        $camp2 = Campaign::firstOrCreate(
            ['title' => 'Relevé Prix Carburant Total / Shell'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Observatoire Énergétique BF',
                'description' => 'Relevé des prix affichés sur les totems des stations-service à Ouagadougou et vérification de la disponibilité.',
                'type' => 'Relevé de prix',
                'city' => 'Ouagadougou & Périphérie',
                'target_neighborhoods' => 'Zone du Bois, Somgandé, Pissy',
                'criteria' => 'Photo totem tarifaire + Saisie prix Super91 et Gasoil',
                'missions_count' => 60,
                'reward_per_mission' => 2500,
                'total_budget' => 180000,
                'status' => 'pending',
            ]
        );

        // 3. Campagne approuvée : Orange Money
        Campaign::firstOrCreate(
            ['title' => 'Contrôle Boutiques Orange Money'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Orange Burkina SA',
                'description' => 'Vérification de la présence du logo officiel Orange Money et de la grille tarifaire des frais de retrait.',
                'type' => 'Vérification point de vente',
                'city' => 'Ouaga 2000, Patte d\'Oie',
                'target_neighborhoods' => 'Ouaga 2000, Patte d\'Oie, Gounghin',
                'criteria' => 'Vérification grille tarifaire visible + liquidité disponible',
                'missions_count' => 200,
                'reward_per_mission' => 2500,
                'total_budget' => 600000,
                'status' => 'active',
                'approved_at' => now()->subDay(),
            ]
        );
    }
}
