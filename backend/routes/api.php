<?php

use App\Http\Controllers\Api\Admin\AdminCampaignController;
use App\Http\Controllers\Api\Admin\AdminSubmissionController;
use App\Http\Controllers\Api\Auth\MobileAuthController;
use App\Http\Controllers\Api\Auth\WebAuthController;
use App\Http\Controllers\Api\Business\CampaignController;
use App\Http\Controllers\Api\Business\CampaignPaymentController;
use App\Http\Controllers\Api\Business\CampaignReportController;
use App\Http\Controllers\Api\MobileMissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WalletController;

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Admin\CampaignAdminController;
use App\Http\Controllers\Api\V1\Admin\SubmissionAdminController;
use App\Http\Controllers\Api\V1\Admin\FraudAdminController;
use App\Http\Controllers\Api\V1\Admin\SchedulerAdminController;
use App\Http\Controllers\Api\V1\Admin\FinanceAdminController;
use App\Http\Controllers\Api\V1\Business\CampaignBusinessController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SapSap Marketplace API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Authentification OTP Mobile Contributeur
    Route::prefix('auth/mobile')->group(function () {
        Route::post('/request-otp', [MobileAuthController::class, 'requestOtp']);
        Route::post('/verify-otp', [MobileAuthController::class, 'verifyOtp']);
    });

    // Authentification Web Business & Admin
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/web/login', [WebAuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/web/logout', [WebAuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
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
                    'phone_number' => $user->phone_number ?? $user->phone,
                    'email' => $user->email,
                    'reputation_score' => $user->reputation_score,
                    'roles' => $user->getRoleNames(),
                ],
                'message' => 'Profil utilisateur récupéré',
                'errors' => null,
            ]);
        });

        // Portefeuille & Retraits Mobile Money
        Route::prefix('wallet')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\V1\WalletController::class, 'show']);
            Route::get('/balance', [WalletController::class, 'getBalance']);
            Route::post('/withdraw', [WalletController::class, 'withdraw']);
            Route::get('/transactions', [\App\Http\Controllers\Api\V1\WalletController::class, 'transactions']);
        });

        // Découverte, Réservation et Soumission de Missions Mobile (Contributeur)
        Route::get('/missions', [MobileMissionController::class, 'index']);
        Route::post('/missions/{id}/reserve', [MobileMissionController::class, 'reserve']);
        Route::post('/missions/{id}/cancel-reservation', [MobileMissionController::class, 'cancelReservation']);
        Route::post('/missions/{id}/submit', [MobileMissionController::class, 'submit']);

        // Espace Business - Gestion des Campagnes
        Route::prefix('business')->group(function () {
            Route::get('/campaigns', [CampaignController::class, 'index']);
            Route::post('/campaigns', [CampaignController::class, 'store']);
            Route::get('/campaigns/{id}', [CampaignController::class, 'show']);
            Route::put('/campaigns/{id}', [CampaignController::class, 'update']);

            // Règlement & Séquestre du Budget
            Route::post('/campaigns/{id}/pay', [CampaignPaymentController::class, 'pay']);

            // Suivi en temps réel & Exportations (CSV / Excel / JSON)
            Route::get('/campaigns/{id}/report', [CampaignReportController::class, 'getReport']);
            Route::get('/campaigns/{id}/export', [CampaignReportController::class, 'exportData']);
            Route::get('/campaigns/{id}/tracking', [CampaignBusinessController::class, 'tracking']);
            Route::get('/campaigns/{id}/results-map', [CampaignBusinessController::class, 'resultsMap']);
            Route::get('/campaigns/{id}/export/csv', [CampaignBusinessController::class, 'exportCsv']);
            Route::get('/campaigns/{id}/export/excel', [CampaignBusinessController::class, 'exportExcel']);
        });

        // Espace Admin - Modération des Campagnes & Revue des Soumissions
        Route::prefix('admin')->group(function () {
            // Modération des campagnes
            Route::get('/campaigns', [CampaignAdminController::class, 'index']);
            Route::get('/campaigns/{id}', [CampaignAdminController::class, 'show']);
            Route::post('/campaigns/{id}/approve', [AdminCampaignController::class, 'approve']);
            Route::post('/campaigns/{id}/reject', [AdminCampaignController::class, 'reject']);

            // Revue Manuelle des Soumissions
            Route::get('/submissions', [SubmissionAdminController::class, 'index']);
            Route::get('/submissions/{id}', [SubmissionAdminController::class, 'show']);
            Route::post('/submissions/{id}/approve', [AdminSubmissionController::class, 'approve']);
            Route::post('/submissions/{id}/validate', [SubmissionAdminController::class, 'validateSubmission']);
            Route::post('/submissions/{id}/reject', [AdminSubmissionController::class, 'reject']);

            // Anti-fraude
            Route::get('/fraud/alerts', [FraudAdminController::class, 'index']);
            Route::get('/fraud/alerts/{id}', [FraudAdminController::class, 'show']);
            Route::post('/fraud/alerts/{id}/resolve', [FraudAdminController::class, 'resolveAlert']);
            Route::post('/fraud/alerts/{id}/dismiss', [FraudAdminController::class, 'dismissAlert']);

            // Planificateur Laravel & Monitoring Auto-Validation 48h
            Route::get('/scheduler/status', [SchedulerAdminController::class, 'getStatus']);
            Route::post('/scheduler/run-auto-validation', [SchedulerAdminController::class, 'runAutoValidation']);
            Route::get('/scheduler/logs', [SchedulerAdminController::class, 'getLogs']);

            // Supervision Financière & Flux Mobile Money
            Route::get('/finances/stats', [FinanceAdminController::class, 'getStats']);
            Route::get('/finances/withdrawals', [FinanceAdminController::class, 'getWithdrawals']);
            Route::get('/finances/ledger', [FinanceAdminController::class, 'getLedger']);

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
