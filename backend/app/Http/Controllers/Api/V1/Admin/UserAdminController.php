<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserAdminController extends Controller
{
    /**
     * Liste des utilisateurs avec rôles Spatie et statistiques
     */
    public function index(Request $request): JsonResponse
    {
        $role = $request->query('role', 'all');
        $search = $request->query('search', '');
        $status = $request->query('status', 'all');

        $query = User::with('roles')->latest();

        if ($role !== 'all') {
            $query->role($role);
        }

        if ($status !== 'all') {
            $isActive = $status === 'active';
            $query->where('is_active', $isActive);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $users = $query->get()->map(function ($user) {
            $primaryRole = $user->roles->first()?->name ?? 'contributor';
            return [
                'id' => $user->id,
                'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
                'email' => $user->email,
                'phone' => $user->phone ?? $user->phone_number,
                'role' => $primaryRole,
                'roles' => $user->getRoleNames(),
                'role_label' => $this->getRoleLabel($primaryRole),
                'reputation_score' => $user->reputation_score ?? 100,
                'completed_missions_count' => $user->completed_missions_count ?? 0,
                'city' => $user->city ?? 'Ouagadougou',
                'district' => $user->district,
                'is_active' => (bool) ($user->is_active ?? true),
                'created_at' => $user->created_at?->toIso8601String(),
                'last_login' => $user->updated_at?->toIso8601String(),
            ];
        });

        $counts = [
            'total' => User::count(),
            'super_admins' => User::role('super-admin')->count(),
            'validators' => User::role('validator')->count(),
            'companies' => User::role(['company-admin', 'company-viewer'])->count(),
            'contributors' => User::role('contributor')->count(),
            'active' => User::where('is_active', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $users,
            'counts' => $counts,
        ], 200);
    }

    /**
     * Détails d'un utilisateur
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['roles', 'wallet', 'walletTransactions'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable.'
            ], 404);
        }

        $primaryRole = $user->roles->first()?->name ?? 'contributor';

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? $user->phone_number,
                'role' => $primaryRole,
                'roles' => $user->getRoleNames(),
                'role_label' => $this->getRoleLabel($primaryRole),
                'reputation_score' => $user->reputation_score ?? 100,
                'completed_missions_count' => $user->completed_missions_count ?? 0,
                'city' => $user->city ?? 'Ouagadougou',
                'district' => $user->district,
                'is_active' => (bool) ($user->is_active ?? true),
                'wallet' => $user->wallet,
                'created_at' => $user->created_at?->toIso8601String(),
            ]
        ], 200);
    }

    /**
     * Mettre à jour le rôle d'un utilisateur
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:super-admin,validator,company-admin,company-viewer,contributor',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable.'
            ], 404);
        }

        $newRole = $request->input('role');
        $user->syncRoles([$newRole]);

        return response()->json([
            'success' => true,
            'message' => "Le rôle de l'utilisateur a été mis à jour vers {$this->getRoleLabel($newRole)}.",
            'data' => [
                'id' => $user->id,
                'role' => $newRole,
                'role_label' => $this->getRoleLabel($newRole),
                'roles' => $user->getRoleNames(),
            ]
        ], 200);
    }

    /**
     * Activer ou suspendre le compte d'un utilisateur
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable.'
            ], 404);
        }

        $user->is_active = !($user->is_active ?? true);
        $user->save();

        $statusLabel = $user->is_active ? 'activé' : 'suspendu';

        return response()->json([
            'success' => true,
            'message' => "Le compte de {$user->name} a été {$statusLabel} avec succès.",
            'data' => [
                'id' => $user->id,
                'is_active' => (bool) $user->is_active,
            ]
        ], 200);
    }

    private function getRoleLabel(string $role): string
    {
        return match ($role) {
            'super-admin' => 'Super Administrateur',
            'validator' => 'Validateur Terrain',
            'company-admin' => 'Admin Entreprise',
            'company-viewer' => 'Observateur Entreprise',
            'contributor' => 'Contributeur Mobile',
            default => ucfirst($role),
        };
    }
}
