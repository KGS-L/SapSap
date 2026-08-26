<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Création des 5 rôles Spatie
        $roles = [
            'super-admin',
            'validator',
            'company-admin',
            'company-viewer',
            'contributor',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // 2. Création des utilisateurs de démonstration

        // Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@sapsap.bf'],
            [
                'name' => 'Super Administrateur',
                'password' => Hash::make('password'),
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Validateur Admin
        $validator = User::firstOrCreate(
            ['email' => 'validator@sapsap.bf'],
            [
                'name' => 'Validateur SapSap',
                'password' => Hash::make('password'),
            ]
        );
        $validator->assignRole('validator');

        // Company Admin (Business)
        $companyAdmin = User::firstOrCreate(
            ['email' => 'business@sapsap.bf'],
            [
                'name' => 'Responsable Entreprise',
                'password' => Hash::make('password'),
            ]
        );
        $companyAdmin->assignRole('company-admin');

        // Company Viewer (Business)
        $companyViewer = User::firstOrCreate(
            ['email' => 'viewer@sapsap.bf'],
            [
                'name' => 'Observateur Entreprise',
                'password' => Hash::make('password'),
            ]
        );
        $companyViewer->assignRole('company-viewer');
    }
}
