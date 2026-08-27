<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Admin\CampaignAdminController;
use App\Http\Controllers\Api\V1\Admin\SubmissionAdminController;
use App\Http\Controllers\Api\V1\Admin\FraudAdminController;
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
        // Campagnes
        Route::get('/campaigns', [CampaignAdminController::class, 'index']);
        Route::get('/campaigns/{id}', [CampaignAdminController::class, 'show']);
        Route::post('/campaigns/{id}/approve', [CampaignAdminController::class, 'approve']);
        Route::post('/campaigns/{id}/reject', [CampaignAdminController::class, 'reject']);

        // Soumissions terrain
        Route::get('/submissions', [SubmissionAdminController::class, 'index']);
        Route::get('/submissions/{id}', [SubmissionAdminController::class, 'show']);
        Route::post('/submissions/{id}/validate', [SubmissionAdminController::class, 'validateSubmission']);
        Route::post('/submissions/{id}/reject', [SubmissionAdminController::class, 'rejectSubmission']);

        // Anti-fraude
        Route::get('/fraud/alerts', [FraudAdminController::class, 'index']);
        Route::get('/fraud/alerts/{id}', [FraudAdminController::class, 'show']);
        Route::post('/fraud/alerts/{id}/resolve', [FraudAdminController::class, 'resolveAlert']);
        Route::post('/fraud/alerts/{id}/dismiss', [FraudAdminController::class, 'dismissAlert']);
    });
});
