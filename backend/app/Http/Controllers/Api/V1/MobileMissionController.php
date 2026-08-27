<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MobileMissionController extends Controller
{
    /**
     * Libération automatique des missions dont le verrou 45 min est expiré.
     */
    private function releaseExpiredLocks(): void
    {
        Mission::where('status', 'assigned')
            ->where('expires_at', '<', now())
            ->update([
                'status' => 'available',
                'assigned_user_id' => null,
                'assigned_at' => null,
                'expires_at' => null,
            ]);
    }

    /**
     * Liste des missions géolocalisées disponibles autour du contributeur.
     */
    public function index(Request $request): JsonResponse
    {
        $this->releaseExpiredLocks();

        $userLat = (float) $request->query('lat', 12.371420);
        $userLng = (float) $request->query('lng', -1.519700);

        $missions = Mission::where('status', 'available')
            ->with('campaign:id,title,location_city')
            ->get()
            ->map(function ($mission) use ($userLat, $userLng) {
                $earthRadius = 6371.0;
                $dLat = deg2rad($mission->latitude - $userLat);
                $dLng = deg2rad($mission->longitude - $userLng);

                $a = sin($dLat / 2) * sin($dLat / 2) +
                    cos(deg2rad($userLat)) * cos(deg2rad($mission->latitude)) *
                    sin($dLng / 2) * sin($dLng / 2);

                $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
                $distanceKm = round($earthRadius * $c, 2);

                $mission->distance_km = $distanceKm;
                return $mission;
            })
            ->sortBy('distance_km')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Missions disponibles récupérées.',
            'data' => $missions,
            'errors' => null,
        ], 200);
    }

    /**
     * Réserver une mission pour un verrou exclusif de 45 minutes.
     */
    public function reserve(Request $request, int $id): JsonResponse
    {
        $this->releaseExpiredLocks();

        $user = $request->user();

        $activeReservation = Mission::where('assigned_user_id', $user->id)
            ->where('status', 'assigned')
            ->where('expires_at', '>', now())
            ->first();

        if ($activeReservation) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà une mission réservée en cours. Veuillez la compléter ou l\'annuler avant d\'en réserver une autre.',
                'errors' => null,
            ], 422);
        }

        $mission = Mission::find($id);

        if (!$mission || $mission->status !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Cette mission n\'est plus disponible à la réservation.',
                'errors' => null,
            ], 422);
        }

        $expiresAt = now()->addMinutes(45);

        $mission->update([
            'status' => 'assigned',
            'assigned_user_id' => $user->id,
            'assigned_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mission réservée avec succès pour 45 minutes.',
            'data' => [
                'mission_id' => $mission->id,
                'title' => $mission->title,
                'status' => 'assigned',
                'assigned_at' => $mission->assigned_at->toISOString(),
                'expires_at' => $mission->expires_at->toISOString(),
                'lock_duration_minutes' => 45,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Annuler manuellement une réservation en cours.
     */
    public function cancelReservation(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $mission = Mission::where('id', $id)
            ->where('assigned_user_id', $user->id)
            ->where('status', 'assigned')
            ->first();

        if (!$mission) {
            return response()->json([
                'success' => false,
                'message' => 'Réservation non trouvée ou déjà expirée.',
                'errors' => null,
            ], 404);
        }

        $mission->update([
            'status' => 'available',
            'assigned_user_id' => null,
            'assigned_at' => null,
            'expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réservation annulée avec succès. La mission est à nouveau disponible.',
            'data' => null,
            'errors' => null,
        ], 200);
    }

    /**
     * Soumettre une preuve de mission avec contrôle de proximité GPS (100m) et empreinte anti-fraude SHA-256.
     */
    public function submit(Request $request, int $id): JsonResponse
    {
        $this->releaseExpiredLocks();

        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'answers' => ['nullable', 'array'],
            'photo_urls' => ['nullable', 'array'],
            'device_id' => ['nullable', 'string'],
        ], [
            'latitude.required' => 'Les coordonnées GPS de latitude sont obligatoires.',
            'longitude.required' => 'Les coordonnées GPS de longitude sont obligatoires.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors de la soumission.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $mission = Mission::where('id', $id)
            ->where('assigned_user_id', $user->id)
            ->where('status', 'assigned')
            ->first();

        if (!$mission) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas réservé cette mission ou le délai de 45 minutes a expiré.',
                'errors' => null,
            ], 422);
        }

        $requestLat = (float) $request->input('latitude');
        $requestLng = (float) $request->input('longitude');

        // Formule Haversine en MÈTRES pour le contrôle de géofencing strict (100m)
        $earthRadiusMeters = 6371000.0;
        $dLat = deg2rad($requestLat - $mission->latitude);
        $dLng = deg2rad($requestLng - $mission->longitude);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($mission->latitude)) * cos(deg2rad($requestLat)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distanceMeters = (int) round($earthRadiusMeters * $c);

        if ($distanceMeters > $mission->radius_meters) {
            return response()->json([
                'success' => false,
                'message' => "Proximité géolocalisée insuffisante. Vous êtes à {$distanceMeters}m du lieu de la mission (rayon maximum de {$mission->radius_meters}m requis).",
                'errors' => [
                    'distance_meters' => $distanceMeters,
                    'allowed_radius_meters' => $mission->radius_meters,
                ],
            ], 422);
        }

        $photoUrls = $request->input('photo_urls', []);
        if (count($photoUrls) < $mission->required_photos_count) {
            return response()->json([
                'success' => false,
                'message' => "Cette mission exige au moins {$mission->required_photos_count} photo(s) de preuve.",
                'errors' => null,
            ], 422);
        }

        $deviceId = $request->input('device_id', 'unknown_device');
        $submissionHash = hash('sha256', $user->id . '-' . $mission->id . '-' . $deviceId . '-' . microtime());

        $submission = null;

        DB::transaction(function () use ($user, $mission, $requestLat, $requestLng, $distanceMeters, $request, $photoUrls, $deviceId, $submissionHash, &$submission) {
            $submission = Submission::create([
                'mission_id' => $mission->id,
                'user_id' => $user->id,
                'latitude' => $requestLat,
                'longitude' => $requestLng,
                'distance_from_target_meters' => $distanceMeters,
                'answers' => $request->input('answers', []),
                'photo_urls' => $photoUrls,
                'device_id' => $deviceId,
                'submission_hash' => $submissionHash,
                'status' => 'pending_review',
            ]);

            $mission->update([
                'status' => 'submitted',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Soumission enregistrée avec succès. Elle est en attente de vérification.',
            'data' => [
                'submission_id' => $submission->id,
                'mission_id' => $mission->id,
                'status' => 'pending_review',
                'distance_from_target_meters' => $distanceMeters,
                'submission_hash' => $submissionHash,
            ],
            'errors' => null,
        ], 201);
    }
}
