<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Admin\CampaignAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SapSap Marketplace API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Authentification publique
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        // Authentification protégée
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Administration & Modération
    Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
        Route::get('/campaigns', [CampaignAdminController::class, 'index']);
        Route::get('/campaigns/{id}', [CampaignAdminController::class, 'show']);
        Route::post('/campaigns/{id}/approve', [CampaignAdminController::class, 'approve']);
        Route::post('/campaigns/{id}/reject', [CampaignAdminController::class, 'reject']);
    });
});
