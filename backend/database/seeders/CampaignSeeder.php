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

        // 1. Campagne active principale : Audit Présence PLV Boissons Sobbra (Story 5.2)
        $campSobbra = Campaign::firstOrCreate(
            ['title' => 'Audit Présence PLV Boissons Sobbra Ouagadougou'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Sobbra Distribution BF',
                'description' => 'Contrôle visuel des affiches, de la disponibilité des boissons et de la mise en avant des réfrigérateurs Sobbra dans les débits de boissons et maquis à Ouagadougou.',
                'type' => 'Audit & Présence',
                'city' => 'Ouagadougou',
                'target_neighborhoods' => 'Patte d\'Oie, Dassasgho, Gounghin, Tampouy, Ouaga 2000, Pissy, Kamsonghin, Somgandé',
                'criteria' => 'Photo façade + Photo frigo + Questionnaire 4 questions',
                'missions_count' => 20,
                'reward_per_mission' => 2500,
                'total_budget' => 50000,
                'status' => 'active',
                'approved_at' => now()->subDays(3),
            ]
        );

        // Définition des 20 points de mission répartis dans Ouagadougou
        $sobbraPoints = [
            // 1. Patte d'Oie
            ['title' => 'Maquis Le Régal — Patte d\'Oie', 'loc' => 'Patte d\'Oie, Face échangeur', 'lat' => 12.3325, 'lng' => -1.5120, 'status' => 'validated'],
            ['title' => 'Kiosque Chez Tanti — Patte d\'Oie', 'loc' => 'Patte d\'Oie Secteur 15', 'lat' => 12.3350, 'lng' => -1.5080, 'status' => 'validated'],
            ['title' => 'Espace Culturel Le Baron — Patte d\'Oie', 'loc' => 'Patte d\'Oie Boulevard', 'lat' => 12.3380, 'lng' => -1.5160, 'status' => 'submitted'],

            // 2. Dassasgho
            ['title' => 'Bar Restaurant Le Faso — Dassasgho', 'loc' => 'Dassasgho, Rue 29.14', 'lat' => 12.3789, 'lng' => -1.4921, 'status' => 'validated'],
            ['title' => 'Maquis Les Champions — Dassasgho', 'loc' => 'Dassasgho Marché', 'lat' => 12.3810, 'lng' => -1.4890, 'status' => 'validated'],
            ['title' => 'Alimentation Générale Wend-Kuni — Dassasgho', 'loc' => 'Dassasgho Nord', 'lat' => 12.3840, 'lng' => -1.4950, 'status' => 'submitted'],

            // 3. Gounghin
            ['title' => 'Maquis Plein Air — Gounghin', 'loc' => 'Gounghin Nord, Avenue Kadiogo', 'lat' => 12.3580, 'lng' => -1.5420, 'status' => 'validated'],
            ['title' => 'Kiosque Sobbra Fraîcheur — Gounghin', 'loc' => 'Gounghin Sud', 'lat' => 12.3520, 'lng' => -1.5480, 'status' => 'validated'],
            ['title' => 'Débit de Boisson La Paix — Gounghin', 'loc' => 'Gounghin Secteur 9', 'lat' => 12.3610, 'lng' => -1.5390, 'status' => 'reserved'],

            // 4. Tampouy
            ['title' => 'Bar Étoile du Nord — Tampouy', 'loc' => 'Tampouy, Grand Marché', 'lat' => 12.4020, 'lng' => -1.5510, 'status' => 'validated'],
            ['title' => 'Maquis La Détente — Tampouy', 'loc' => 'Tampouy Secteur 22', 'lat' => 12.4080, 'lng' => -1.5460, 'status' => 'validated'],
            ['title' => 'Kiosque Oasis — Tampouy', 'loc' => 'Tampouy Ouest', 'lat' => 12.4120, 'lng' => -1.5580, 'status' => 'submitted'],

            // 5. Ouaga 2000
            ['title' => 'Lounge VIP Prestige — Ouaga 2000', 'loc' => 'Ouaga 2000, Boulevard Mouammar Kadhafi', 'lat' => 12.3080, 'lng' => -1.5050, 'status' => 'validated'],
            ['title' => 'Café des Ambassades — Ouaga 2000', 'loc' => 'Ouaga 2000 Zone Ambassades', 'lat' => 12.3120, 'lng' => -1.4980, 'status' => 'validated'],
            ['title' => 'Espace Gastronomique Le Palmier — Ouaga 2000', 'loc' => 'Ouaga 2000 Sud', 'lat' => 12.3020, 'lng' => -1.5120, 'status' => 'validated'],

            // 6. Pissy
            ['title' => 'Maquis de l\'Espoir — Pissy', 'loc' => 'Pissy Secteur 17', 'lat' => 12.3551, 'lng' => -1.5432, 'status' => 'validated'],
            ['title' => 'Kiosque Rafraîchissement — Pissy', 'loc' => 'Pissy Carrefour', 'lat' => 12.3590, 'lng' => -1.5490, 'status' => 'submitted'],

            // 7. Kamsonghin & Somgandé
            ['title' => 'Bar Central — Kamsonghin', 'loc' => 'Kamsonghin Centre', 'lat' => 12.3650, 'lng' => -1.5280, 'status' => 'validated'],
            ['title' => 'Maquis Le Baobab — Somgandé', 'loc' => 'Somgandé Zone Industrielle', 'lat' => 12.3950, 'lng' => -1.4880, 'status' => 'reserved'],
            ['title' => 'Kiosque Populaire — Zone du Bois', 'loc' => 'Zone du Bois', 'lat' => 12.3750, 'lng' => -1.5050, 'status' => 'available'],
        ];

        foreach ($sobbraPoints as $p) {
            Mission::firstOrCreate(
                ['campaign_id' => $campSobbra->id, 'title' => $p['title']],
                [
                    'location_name' => $p['loc'],
                    'latitude' => $p['lat'],
                    'longitude' => $p['lng'],
                    'reward' => 2500,
                    'status' => $p['status'],
                    'reserved_at' => in_array($p['status'], ['reserved', 'submitted', 'validated']) ? now()->subHours(5) : null,
                    'submitted_at' => in_array($p['status'], ['submitted', 'validated']) ? now()->subHours(3) : null,
                ]
            );
        }

        // 2. Deuxième campagne : Orange Money Contrôle Visibilité
        Campaign::firstOrCreate(
            ['title' => 'Contrôle Kiosques & Boutiques Orange Money'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Orange Burkina SA',
                'description' => 'Vérification de la conformité des affichages tarifaires et de la disponibilité du cash in/cash out.',
                'type' => 'Vérification point de vente',
                'city' => 'Ouagadougou',
                'target_neighborhoods' => 'Ouaga 2000, Patte d\'Oie, Gounghin, Kamsonghin',
                'criteria' => 'Photo façade + Photo grille tarifaire + Test liquidité',
                'missions_count' => 50,
                'reward_per_mission' => 2000,
                'total_budget' => 100000,
                'status' => 'active',
                'approved_at' => now()->subDays(1),
            ]
        );

        // 3. Campagne en attente : Observatoire Carburant
        Campaign::firstOrCreate(
            ['title' => 'Relevé Prix Carburant Total / Shell'],
            [
                'user_id' => $businessUser->id,
                'company_name' => 'Observatoire Énergétique BF',
                'description' => 'Relevé des prix affichés sur les totems des stations-service à Ouagadougou.',
                'type' => 'Relevé de prix',
                'city' => 'Ouagadougou & Périphérie',
                'target_neighborhoods' => 'Zone du Bois, Somgandé, Pissy',
                'criteria' => 'Photo totem tarifaire + Saisie prix Super91 et Gasoil',
                'missions_count' => 60,
                'reward_per_mission' => 2500,
                'total_budget' => 150000,
                'status' => 'pending',
            ]
        );
    }
}
