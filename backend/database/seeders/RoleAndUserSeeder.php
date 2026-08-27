<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Réinitialiser le cache des permissions Spatie
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Création des rôles
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $validatorRole  = Role::firstOrCreate(['name' => 'validator']);
        $companyAdminRole = Role::firstOrCreate(['name' => 'company-admin']);
        $companyViewerRole = Role::firstOrCreate(['name' => 'company-viewer']);

        // 2. Création des permissions
        $permissions = [
            'manage-users',
            'moderate-campaigns',
            'validate-submissions',
            'view-fraud-alerts',
            'manage-settings',
            'create-campaigns',
            'view-campaign-results',
        ];

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName]);
        }

        // Attribution des permissions aux rôles
        $superAdminRole->syncPermissions(Permission::all());
        $validatorRole->syncPermissions(['validate-submissions', 'moderate-campaigns', 'view-fraud-alerts']);
        $companyAdminRole->syncPermissions(['create-campaigns', 'view-campaign-results']);
        $companyViewerRole->syncPermissions(['view-campaign-results']);

        // 3. Création des comptes administrateurs et entreprises de test

        // Super-Admin SapSap
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@sapsap.bf'],
            [
                'name' => 'Ousmane Traoré (Super-Admin)',
                'phone' => '+226 70 01 02 03',
                'password' => Hash::make('Password123!'),
                'city' => 'Ouagadougou',
                'reputation_score' => 100,
                'is_active' => true,
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Validateur Terrain SapSap
        $validator = User::firstOrCreate(
            ['email' => 'validator@sapsap.bf'],
            [
                'name' => 'Fatimata Zongo (Validatrice)',
                'phone' => '+226 76 11 22 33',
                'password' => Hash::make('Password123!'),
                'city' => 'Ouagadougou',
                'reputation_score' => 100,
                'is_active' => true,
            ]
        );
        $validator->assignRole('validator');

        // Admin Entreprise Sobbra BF
        $companyAdmin = User::firstOrCreate(
            ['email' => 'business@sobbra.bf'],
            [
                'name' => 'Jean-Marc Somé (Sobbra Distribution)',
                'phone' => '+226 78 44 55 66',
                'password' => Hash::make('Password123!'),
                'city' => 'Ouagadougou',
                'reputation_score' => 100,
                'is_active' => true,
            ]
        );
        $companyAdmin->assignRole('company-admin');
    }
}
