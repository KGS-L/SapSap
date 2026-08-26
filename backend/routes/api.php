<?php

use App\Http\Controllers\Api\Admin\AdminCampaignController;
use App\Http\Controllers\Api\Auth\MobileAuthController;
use App\Http\Controllers\Api\Auth\WebAuthController;
use App\Http\Controllers\Api\Business\CampaignController;
use App\Http\Controllers\Api\Business\CampaignPaymentController;
use App\Http\Controllers\Api\MobileMissionController;
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

        // Découverte, Réservation et Soumission de Missions Mobile (Contributeur)
        Route::get('/missions', [MobileMissionController::class, 'index']);
        Route::post('/missions/{id}/reserve', [MobileMissionController::class, 'reserve']);
        Route::post('/missions/{id}/cancel-reservation', [MobileMissionController::class, 'cancelReservation']);
        Route::post('/missions/{id}/submit', [MobileMissionController::class, 'submit']);

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

        // Espace Business - Gestion des Campagnes (company-admin, company-viewer, super-admin)
        Route::middleware('role:company-admin|company-viewer|super-admin')->prefix('business')->group(function () {
            Route::get('/campaigns', [CampaignController::class, 'index']);
            Route::post('/campaigns', [CampaignController::class, 'store']);
            Route::get('/campaigns/{id}', [CampaignController::class, 'show']);
            Route::put('/campaigns/{id}', [CampaignController::class, 'update']);

            // Règlement & Séquestre du Budget de la Campagne
            Route::post('/campaigns/{id}/pay', [CampaignPaymentController::class, 'pay']);
        });

        // Espace Admin - Modération & Approbation des Campagnes (super-admin, validator)
        Route::middleware('role:super-admin|validator')->prefix('admin')->group(function () {
            Route::get('/campaigns', [AdminCampaignController::class, 'index']);
            Route::post('/campaigns/{id}/approve', [AdminCampaignController::class, 'approve']);
            Route::post('/campaigns/{id}/reject', [AdminCampaignController::class, 'reject']);

            Route::get('/test-rbac', function () {
                return response()->json([
                    'success' => true,
                    'message' => 'Accès Admin/Validateur autorisé.',
                    'data' => null,
                    'errors' => null,
                ]);
            });
        });
    });
});
