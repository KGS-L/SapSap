<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                // Formule Haversine pour calcul précis de la distance en KM
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

        // Vérifier si le contributeur a déjà une réservation active en cours
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
}
