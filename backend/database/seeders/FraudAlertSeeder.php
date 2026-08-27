<?php

namespace Database\Seeders;

use App\Models\FraudAlert;
use App\Models\MediaFingerprint;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;

class FraudAlertSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $submissions = Submission::all();
        $moussa = User::where('email', 'moussa@sapsap.bf')->first();
        $ibrahim = User::where('email', 'ibrahim@sapsap.bf')->first();
        $amina = User::where('email', 'amina@sapsap.bf')->first();

        // 1. Enregistrer des empreintes SHA-256
        if ($moussa && isset($submissions[0])) {
            MediaFingerprint::firstOrCreate(
                ['file_hash' => 'a8f5c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111'],
                [
                    'submission_id' => $submissions[0]->id,
                    'user_id' => $moussa->id,
                    'file_name' => 'facade_maquis_01.jpg',
                    'file_size' => 245000,
                    'photo_url' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
                ]
            );
        }

        // 2. Alerte 1 : Image dupliquée (Hash SHA-256 identique)
        if ($ibrahim && isset($submissions[2])) {
            FraudAlert::firstOrCreate(
                [
                    'title' => 'Image dupliquée détectée (Empreinte SHA-256 identique)',
                    'alert_type' => 'duplicate_image',
                ],
                [
                    'user_id' => $ibrahim->id,
                    'submission_id' => $submissions[2]->id,
                    'severity' => 'high',
                    'description' => "La photo soumise pour le 'Contrôle Affiche' a la même signature SHA-256 qu'une photo de la soumission SUB-2026-001 (par Moussa Ouédraogo).",
                    'details' => [
                        'sha256_hash' => 'a8f5c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111',
                        'original_submission_id' => 1,
                        'original_user_name' => 'Moussa Ouédraogo',
                        'match_percentage' => 100,
                        'detected_at' => now()->subHours(1)->toDateTimeString(),
                    ],
                    'status' => 'pending',
                ]
            );
        }

        // 3. Alerte 2 : Partage de Device ID (Multi-comptes sur un smartphone)
        if ($moussa) {
            FraudAlert::firstOrCreate(
                [
                    'title' => 'Multi-comptes détecté sur le terminal DEV-BF-OUAGA-99182',
                    'alert_type' => 'device_sharing',
                ],
                [
                    'user_id' => $moussa->id,
                    'severity' => 'high',
                    'description' => '3 comptes contributeurs distincts se sont connectés et ont soumis des missions depuis le même smartphone physique.',
                    'details' => [
                        'device_id' => 'DEV-BF-OUAGA-99182',
                        'accounts_count' => 3,
                        'linked_accounts' => [
                            ['name' => 'Moussa Ouédraogo', 'phone' => '+226 70 12 34 56', 'score' => 96],
                            ['name' => 'Amina Sawadogo', 'phone' => '+226 76 98 76 54', 'score' => 92],
                            ['name' => 'Ibrahim Kaboré', 'phone' => '+226 65 11 22 33', 'score' => 64],
                        ],
                        'risk_factor' => 'Suspect de ferme de téléphones ou contournement de seuils',
                    ],
                    'status' => 'pending',
                ]
            );
        }

        // 4. Alerte 3 : Écart GPS anormal (Anomalie spatiale)
        if ($ibrahim && isset($submissions[2])) {
            FraudAlert::firstOrCreate(
                [
                    'title' => 'Anomalie de positionnement GPS (> 100m)',
                    'alert_type' => 'gps_spoofing',
                ],
                [
                    'user_id' => $ibrahim->id,
                    'submission_id' => $submissions[2]->id,
                    'severity' => 'medium',
                    'description' => "La prise de vue a été effectuée à 140m du point cible de la mission (tolérance max autorisée : 100m).",
                    'details' => [
                        'distance_meters' => 140,
                        'allowed_tolerance' => 100,
                        'location' => 'Secteur 12 (Gounghin), Ouagadougou',
                        'accuracy' => '±6m',
                    ],
                    'status' => 'pending',
                ]
            );
        }
    }
}
