<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Mission;
use App\Models\SchedulerLog;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SubmissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer les contributeurs de test
        $moussa = User::firstOrCreate(
            ['email' => 'moussa@sapsap.bf'],
            [
                'name' => 'Moussa Ouédraogo',
                'password' => Hash::make('Password123!'),
                'phone' => '+226 70 12 34 56',
                'city' => 'Ouagadougou',
                'reputation_score' => 96,
                'is_active' => true,
            ]
        );

        $amina = User::firstOrCreate(
            ['email' => 'amina@sapsap.bf'],
            [
                'name' => 'Amina Sawadogo',
                'password' => Hash::make('Password123!'),
                'phone' => '+226 76 98 76 54',
                'city' => 'Ouagadougou',
                'reputation_score' => 92,
                'is_active' => true,
            ]
        );

        $ibrahim = User::firstOrCreate(
            ['email' => 'ibrahim@sapsap.bf'],
            [
                'name' => 'Ibrahim Kaboré',
                'password' => Hash::make('Password123!'),
                'phone' => '+226 65 11 22 33',
                'city' => 'Ouagadougou',
                'reputation_score' => 64,
                'is_active' => true,
            ]
        );

        $missions = Mission::all();
        if ($missions->isEmpty()) {
            return;
        }

        // 1. Soumission Conforme Moussa (Écart 22m, récente)
        if (isset($missions[0])) {
            Submission::firstOrCreate(
                ['mission_id' => $missions[0]->id, 'user_id' => $moussa->id],
                [
                    'status' => 'submitted',
                    'submitted_latitude' => 12.3716,
                    'submitted_longitude' => -1.5195,
                    'gps_accuracy' => 8.0,
                    'gps_distance_meters' => 22.0,
                    'device_id' => 'DEV-BF-OUAGA-99182',
                    'answers' => [
                        'Nombre de frigos Sobbra visibles' => '2 frigos vitrés opérationnels',
                        'Affiche promotionnelle présente' => 'Oui, affichage bien visible sur la façade',
                        'Prix Beaufort 50cl' => '800 FCFA',
                        'Disponibilité stock' => 'Plus de 5 casiers en réserve'
                    ],
                    'photos' => [
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
                        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'
                    ],
                    'created_at' => now()->subMinutes(15),
                ]
            );
        }

        // 2. Soumission Conforme Amina (Écart 45m, récente)
        if (isset($missions[1])) {
            Submission::firstOrCreate(
                ['mission_id' => $missions[1]->id, 'user_id' => $amina->id],
                [
                    'status' => 'submitted',
                    'submitted_latitude' => 12.3768,
                    'submitted_longitude' => -1.5142,
                    'gps_accuracy' => 12.0,
                    'gps_distance_meters' => 45.0,
                    'device_id' => 'DEV-BF-OUAGA-77211',
                    'answers' => [
                        'Prix Super 91 affiché' => '850 FCFA/L',
                        'Prix Gasoil affiché' => '775 FCFA/L',
                        'File d\'attente à la pompe' => 'Fluide (moins de 2 véhicules)',
                        'Paiement Mobile Money actif' => 'Oui (Orange Money et Moov Money disponibles)'
                    ],
                    'photos' => [
                        'https://images.unsplash.com/photo-1527018607636-921ec5735f5d?w=600'
                    ],
                    'created_at' => now()->subMinutes(45),
                ]
            );
        }

        // 3. Soumission Suspecte Ibrahim (Écart 140m > 100m)
        if (isset($missions[2])) {
            Submission::firstOrCreate(
                ['mission_id' => $missions[2]->id, 'user_id' => $ibrahim->id],
                [
                    'status' => 'fraud_suspect',
                    'submitted_latitude' => 12.3880,
                    'submitted_longitude' => -1.5030,
                    'gps_accuracy' => 6.0,
                    'gps_distance_meters' => 140.0,
                    'device_id' => 'DEV-BF-OUAGA-33044',
                    'answers' => [
                        'Point de vente trouvé' => 'Oui mais rideau baissé',
                        'Photos prises depuis' => 'Véhicule en mouvement'
                    ],
                    'photos' => [
                        'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=600'
                    ],
                    'created_at' => now()->subHours(1),
                ]
            );
        }

        // 4. Story 4.4 : Soumission éligible à l'auto-validation (En attente depuis 52h > 48h)
        $extraMission1 = Mission::firstOrCreate(
            ['title' => 'Vérification Totem Shell Dassasgho'],
            [
                'campaign_id' => $missions[0]->campaign_id ?? 1,
                'location_name' => 'Dassasgho, Rue 29.14',
                'latitude' => 12.3789,
                'longitude' => -1.4921,
                'reward' => 2500,
                'status' => 'submitted',
            ]
        );

        Submission::firstOrCreate(
            ['mission_id' => $extraMission1->id, 'user_id' => $moussa->id],
            [
                'status' => 'submitted',
                'submitted_latitude' => 12.3788,
                'submitted_longitude' => -1.4920,
                'gps_accuracy' => 7.0,
                'gps_distance_meters' => 18.0,
                'device_id' => 'DEV-BF-OUAGA-99182',
                'answers' => [
                    'Prix Totem affiché' => 'Super91 850 FCFA, Gasoil 775 FCFA',
                    'Boutique ouverte' => 'Oui',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600'
                ],
                'created_at' => now()->subHours(52), // > 48 heures d'inactivité
                'updated_at' => now()->subHours(52),
            ]
        );

        // 5. Story 4.4 : Soumission déjà auto-validée lors d'un cycle antérieur
        $extraMission2 = Mission::firstOrCreate(
            ['title' => 'Audit Kiosque Orange Money Pissy'],
            [
                'campaign_id' => $missions[0]->campaign_id ?? 1,
                'location_name' => 'Pissy Secteur 17',
                'latitude' => 12.3551,
                'longitude' => -1.5432,
                'reward' => 2000,
                'status' => 'validated',
            ]
        );

        Submission::firstOrCreate(
            ['mission_id' => $extraMission2->id, 'user_id' => $amina->id],
            [
                'status' => 'validated',
                'submitted_latitude' => 12.3550,
                'submitted_longitude' => -1.5430,
                'gps_accuracy' => 5.0,
                'gps_distance_meters' => 25.0,
                'device_id' => 'DEV-BF-OUAGA-77211',
                'answers' => [
                    'Présence Grille tarifaire' => 'Affiche visible sur le comptoir',
                    'Liquidité disponible' => 'Plus de 200 000 FCFA',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=600'
                ],
                'validated_at' => now()->subHours(24),
                'auto_validated_at' => now()->subHours(24), // Auto-validé à 48h
                'created_at' => now()->subHours(72),
                'updated_at' => now()->subHours(24),
            ]
        );

        // Initialisation des logs du Scheduler
        SchedulerLog::firstOrCreate(
            ['job_name' => 'CheckPendingSubmissionsJob', 'status' => 'success'],
            [
                'executed_at' => now()->subHours(1),
                'processed_count' => 1,
                'status' => 'success',
                'details' => [
                    'hours_threshold' => 48,
                    'duration_ms' => 42.5,
                    'processed_items' => [
                        [
                            'submission_id' => 5,
                            'contributor_name' => 'Amina Sawadogo',
                            'mission_title' => 'Audit Kiosque Orange Money Pissy',
                            'reward' => 2000,
                            'auto_validated_at' => now()->subHours(24)->toIso8601String(),
                        ]
                    ],
                ],
                'triggered_by' => 'scheduler',
            ]
        );
    }
}
