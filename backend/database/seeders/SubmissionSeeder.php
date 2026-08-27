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
        // 1. Créer les contributeurs de test
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
                'reputation_score' => 94,
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
                'reputation_score' => 88,
                'is_active' => true,
            ]
        );

        $contributors = [$moussa, $amina, $ibrahim];

        // 2. Parcourir toutes les missions de la campagne Sobbra et créer les soumissions correspondantes
        $missions = Mission::all();
        if ($missions->isEmpty()) {
            return;
        }

        $photoPool = [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
            'https://images.unsplash.com/photo-1527018607636-921ec5735f5d?w=800',
            'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800',
            'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=800',
            'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800',
        ];

        foreach ($missions as $index => $mission) {
            $contributor = $contributors[$index % count($contributors)];

            if ($mission->status === 'validated') {
                $mission->update(['assigned_user_id' => $contributor->id]);

                Submission::firstOrCreate(
                    ['mission_id' => $mission->id],
                    [
                        'user_id' => $contributor->id,
                        'status' => 'validated',
                        'submitted_latitude' => $mission->latitude + 0.0001,
                        'submitted_longitude' => $mission->longitude + 0.0001,
                        'gps_accuracy' => 6.5,
                        'gps_distance_meters' => 15.0 + ($index * 2),
                        'device_id' => 'DEV-BF-OUAGA-' . (10000 + $index),
                        'answers' => [
                            'Affiches publicitaires visibles' => 'Oui, grande affiche PLV en façade principale',
                            'Frigo Sobbra opérationnel' => 'Oui, 2 réfrigérateurs fonctionnels et branchés',
                            'Prix Beaufort Lager 50cl' => '800 FCFA',
                            'Stock disponible' => 'Plus de 8 casiers en stock',
                        ],
                        'photos' => [
                            $photoPool[$index % count($photoPool)],
                            $photoPool[($index + 1) % count($photoPool)],
                        ],
                        'validated_at' => now()->subHours(rand(2, 48)),
                        'created_at' => now()->subHours(rand(4, 72)),
                    ]
                );
            } elseif ($mission->status === 'submitted') {
                $mission->update(['assigned_user_id' => $contributor->id]);

                Submission::firstOrCreate(
                    ['mission_id' => $mission->id],
                    [
                        'user_id' => $contributor->id,
                        'status' => 'submitted',
                        'submitted_latitude' => $mission->latitude + 0.0002,
                        'submitted_longitude' => $mission->longitude - 0.0001,
                        'gps_accuracy' => 8.0,
                        'gps_distance_meters' => 24.0,
                        'device_id' => 'DEV-BF-OUAGA-' . (20000 + $index),
                        'answers' => [
                            'Affiches publicitaires visibles' => 'Oui, poster bien exposé sur le comptoir',
                            'Frigo Sobbra opérationnel' => '1 réfrigérateur Sobbra présent',
                            'Prix Castel Beer 50cl' => '700 FCFA',
                            'Stock disponible' => '3 casiers en réserve',
                        ],
                        'photos' => [
                            $photoPool[($index + 2) % count($photoPool)],
                        ],
                        'created_at' => now()->subMinutes(rand(10, 180)),
                    ]
                );
            } elseif ($mission->status === 'reserved') {
                $mission->update([
                    'assigned_user_id' => $contributor->id,
                    'reserved_at' => now()->subMinutes(20),
                    'reservation_expires_at' => now()->addMinutes(25),
                ]);
            }
        }

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
                            'submission_id' => 1,
                            'contributor_name' => 'Amina Sawadogo',
                            'mission_title' => 'Maquis Plein Air — Gounghin',
                            'reward' => 2500,
                            'auto_validated_at' => now()->subHours(24)->toIso8601String(),
                        ]
                    ],
                ],
                'triggered_by' => 'scheduler',
            ]
        );
    }
}
