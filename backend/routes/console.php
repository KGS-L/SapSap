<?php

use App\Jobs\CheckPendingSubmissionsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Laravel Scheduler Definitions (SapSap Background Tasks)
|--------------------------------------------------------------------------
*/

// Story 4.4 : Auto-validation des soumissions en attente de plus de 48h exécutée chaque heure
Schedule::job(new CheckPendingSubmissionsJob(48))
    ->hourly()
    ->name('sapsap-auto-validate-submissions-48h')
    ->withoutOverlapping();
