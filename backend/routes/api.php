<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\WalletController;

use App\Http\Controllers\Api\V1\Admin\CampaignAdminController;
use App\Http\Controllers\Api\V1\Admin\SubmissionAdminController;
use App\Http\Controllers\Api\V1\Admin\FraudAdminController;
use App\Http\Controllers\Api\V1\Admin\SchedulerAdminController;
use App\Http\Controllers\Api\V1\Admin\FinanceAdminController;
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

    // Story 5.1 : Portefeuille Contributeur & Retraits Mobile Money
    Route::prefix('wallet')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [WalletController::class, 'show']);
        Route::post('/withdraw', [WalletController::class, 'withdraw']);
        Route::get('/transactions', [WalletController::class, 'transactions']);
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

        // Planificateur Laravel & Monitoring Auto-Validation 48h (Story 4.4)
        Route::get('/scheduler/status', [SchedulerAdminController::class, 'getStatus']);
        Route::post('/scheduler/run-auto-validation', [SchedulerAdminController::class, 'runAutoValidation']);
        Route::get('/scheduler/logs', [SchedulerAdminController::class, 'getLogs']);

        // Story 5.1 : Supervision Financière, Flux Mobile Money & Registre
        Route::get('/finances/stats', [FinanceAdminController::class, 'getStats']);
        Route::get('/finances/withdrawals', [FinanceAdminController::class, 'getWithdrawals']);
        Route::get('/finances/ledger', [FinanceAdminController::class, 'getLedger']);
    });

    // Story 5.2 : Portail Entreprise (business.sapsap.bf) - Suivi Temps Réel & Cartographie des Résultats
    Route::prefix('business')->middleware('auth:sanctum')->group(function () {
        Route::get('/campaigns', [\App\Http\Controllers\Api\V1\Business\CampaignBusinessController::class, 'index']);
        Route::get('/campaigns/{id}', [\App\Http\Controllers\Api\V1\Business\CampaignBusinessController::class, 'show']);
        Route::get('/campaigns/{id}/tracking', [\App\Http\Controllers\Api\V1\Business\CampaignBusinessController::class, 'tracking']);
        Route::get('/campaigns/{id}/results-map', [\App\Http\Controllers\Api\V1\Business\CampaignBusinessController::class, 'resultsMap']);
    });
});


