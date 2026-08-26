<?php

use App\Http\Controllers\Api\Auth\MobileAuthController;
use App\Http\Controllers\Api\Auth\WebAuthController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SapSap V1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Authentification OTP Mobile Contributeur
    Route::prefix('auth/mobile')->group(function () {
        Route::post('/request-otp', [MobileAuthController::class, 'requestOtp']);
        Route::post('/verify-otp', [MobileAuthController::class, 'verifyOtp']);
    });

    // Authentification Web Business & Admin
    Route::prefix('auth/web')->group(function () {
        Route::post('/login', [WebAuthController::class, 'login']);
        Route::middleware('auth:sanctum')->post('/logout', [WebAuthController::class, 'logout']);
    });

    // Endpoints protégés par Laravel Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        // Profil Utilisateur / Contributeur
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

        Route::get('/user', function (Request $request) {
            $user = $request->user();
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone_number' => $user->phone_number,
                    'email' => $user->email,
                    'reputation_score' => $user->reputation_score,
                    'roles' => $user->getRoleNames(),
                ],
                'message' => 'Profil utilisateur récupéré',
                'errors' => null,
            ]);
        });

        // Route de test d'autorisation RBAC Admin / Validator
        Route::middleware('role:super-admin|validator')->get('/admin/test-rbac', function () {
            return response()->json([
                'success' => true,
                'message' => 'Accès Admin/Validateur autorisé.',
                'data' => null,
                'errors' => null,
            ]);
        });
    });
});
