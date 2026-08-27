<?php

namespace App\Services;

use App\Models\FraudAlert;
use App\Models\MediaFingerprint;
use App\Models\Submission;
use App\Models\User;

class FraudDetectionService
{
    /**
     * Vérifier l'unicité de l'empreinte SHA-256 de la photo soumise
     */
    public function checkMediaFingerprint(
        int $submissionId,
        int $userId,
        string $fileHash,
        string $fileName = '',
        int $fileSize = 0,
        string $photoUrl = ''
    ): ?FraudAlert {
        // Rechercher si cette empreinte SHA-256 a déjà été enregistrée pour une autre soumission
        $existing = MediaFingerprint::with(['submission', 'user'])
            ->where('file_hash', $fileHash)
            ->where('submission_id', '!=', $submissionId)
            ->first();

        if ($existing) {
            // Fraude détectée : réutilisation d'image identique
            $alert = FraudAlert::create([
                'user_id' => $userId,
                'submission_id' => $submissionId,
                'alert_type' => 'duplicate_image',
                'severity' => 'high',
                'title' => 'Image dupliquée détectée (Empreinte SHA-256 identique)',
                'description' => "La photo soumise possède la même signature cryptographique SHA-256 qu'une photo de la soumission SUB-2026-00{$existing->submission_id} (par {$existing->user?->name}).",
                'details' => [
                    'sha256_hash' => $fileHash,
                    'original_submission_id' => $existing->submission_id,
                    'original_user_id' => $existing->user_id,
                    'original_user_name' => $existing->user?->name,
                    'file_name' => $fileName,
                    'file_size' => $fileSize,
                ],
                'status' => 'pending',
            ]);

            // Marquer la soumission comme suspecte
            Submission::where('id', $submissionId)->update(['status' => 'fraud_suspect']);

            return $alert;
        }

        // Enregistrer la nouvelle empreinte
        MediaFingerprint::create([
            'submission_id' => $submissionId,
            'user_id' => $userId,
            'file_hash' => $fileHash,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'photo_url' => $photoUrl,
        ]);

        return null;
    }

    /**
     * Vérifier si un Device ID est partagé par plus de 2 comptes contributeurs
     */
    public function checkDeviceSharing(int $userId, string $deviceId): ?FraudAlert
    {
        if (empty($deviceId) || $deviceId === 'N/A') {
            return null;
        }

        // Identifier les utilisateurs uniques ayant soumis avec ce device_id
        $userIds = Submission::where('device_id', $deviceId)
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        if (! in_array($userId, $userIds)) {
            $userIds[] = $userId;
        }

        if (count($userIds) > 2) {
            $users = User::whereIn('id', $userIds)->get(['id', 'name', 'email', 'phone']);

            return FraudAlert::firstOrCreate(
                [
                    'alert_type' => 'device_sharing',
                    'title' => "Collusion multi-comptes sur le terminal ($deviceId)",
                ],
                [
                    'user_id' => $userId,
                    'severity' => 'high',
                    'description' => count($userIds) . " comptes distincts ont soumis des missions depuis le même smartphone ($deviceId).",
                    'details' => [
                        'device_id' => $deviceId,
                        'accounts_count' => count($userIds),
                        'accounts' => $users->toArray(),
                    ],
                    'status' => 'pending',
                ]
            );
        }

        return null;
    }
}
