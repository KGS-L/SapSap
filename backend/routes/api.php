<?php

use App\Http\Controllers\Api\Auth\MobileAuthController;
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

    // Endpoints protégés par Laravel Sanctum
    Route::middleware('auth:sanctum')->group(function () {
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
    });
});
