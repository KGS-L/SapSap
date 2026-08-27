<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authentification par Email et Mot de passe pour les portails Web (Admin & Business)
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants invalides (Email ou mot de passe incorrect).',
                'errors' => [
                    'email' => ['Les identifiants fournis ne correspondent à aucun compte actif.']
                ]
            ], 401);
        }

        // Récupération des rôles de l'utilisateur
        $roles = $user->getRoleNames();
        $primaryRole = $roles->first() ?? 'user';

        // Génération du token d'accès Laravel Sanctum
        $token = $user->createToken('web-admin-session', ['*'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentification réussie.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $primaryRole,
                'roles' => $roles,
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'reputation_score' => $user->reputation_score ?? 100,
                'created_at' => $user->created_at,
            ]
        ], 200);
    }

    /**
     * Déconnexion et révocation du token d'API
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Session terminée avec succès.'
        ], 200);
    }

    /**
     * Profil de l'utilisateur actuellement authentifié
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $roles = $user->getRoleNames();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $roles->first() ?? 'user',
                'roles' => $roles,
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'reputation_score' => $user->reputation_score ?? 100,
            ]
        ], 200);
    }
}
