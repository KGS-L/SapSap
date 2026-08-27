<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Obtenir le profil de l'utilisateur connecté.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Profil utilisateur récupéré.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone_number' => $user->phone_number,
                'email' => $user->email,
                'district' => $user->district,
                'city' => $user->city ?? 'Ouagadougou',
                'reputation_score' => $user->reputation_score,
                'completed_missions_count' => $user->completed_missions_count,
                'created_at' => $user->created_at ? $user->created_at->toISOString() : null,
                'roles' => $user->getRoleNames(),
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Mettre à jour le profil de l'utilisateur connecté.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:150'],
            'district' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:150'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation lors de la mise à jour du profil.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Exclure spécifiquement les modifications directes de réputation et de missions
        $data = $request->only(['first_name', 'last_name', 'name', 'district', 'city']);

        $user->fill($data);

        if ($user->first_name || $user->last_name) {
            $user->name = trim("{$user->first_name} {$user->last_name}");
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone_number' => $user->phone_number,
                'email' => $user->email,
                'district' => $user->district,
                'city' => $user->city,
                'reputation_score' => $user->reputation_score,
                'completed_missions_count' => $user->completed_missions_count,
                'created_at' => $user->created_at ? $user->created_at->toISOString() : null,
                'roles' => $user->getRoleNames(),
            ],
            'errors' => null,
        ], 200);
    }
}
