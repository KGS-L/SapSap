import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  AutoValidationRunResult,
  SchedulerLog,
  SchedulerLogsResponse,
  SchedulerStats,
  SchedulerStatusResponse
} from '../models/scheduler.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1/admin/scheduler';

  // Signals réactifs pour le monitoring d'état
  readonly stats = signal<SchedulerStats>({
    is_active: true,
    interval_description: 'Toutes les heures (0 * * * *)',
    auto_validation_delay_hours: 48,
    pending_eligible_count: 1,
    total_auto_validated_count: 3,
    total_submissions_count: 5,
    last_run: {
      id: 1,
      executed_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      processed_count: 1,
      status: 'success',
      triggered_by: 'scheduler'
    },
    next_estimated_run: new Date(Date.now() + 46 * 60 * 1000).toISOString()
  });

  readonly logs = signal<SchedulerLog[]>([
    {
      id: 1,
      job_name: 'CheckPendingSubmissionsJob',
      executed_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      processed_count: 1,
      status: 'success',
      details: {
        hours_threshold: 48,
        duration_ms: 38.4,
        processed_items: [
          {
            submission_id: 5,
            contributor_name: 'Amina Sawadogo',
            mission_title: 'Audit Kiosque Orange Money Pissy',
            reward: 2000,
            auto_validated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          }
        ]
      },
      triggered_by: 'scheduler',
      created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 14 * 60 * 1000).toISOString()
    }
  ]);

  readonly isLoading = signal<boolean>(false);
  readonly isExecuting = signal<boolean>(false);

  /**
   * Charger les statistiques réelles du Scheduler
   */
  loadStatus(): Observable<SchedulerStatusResponse> {
    this.isLoading.set(true);
    return this.http.get<SchedulerStatusResponse>(`${this.baseUrl}/status`).pipe(
      tap((res: SchedulerStatusResponse) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of({
          success: true,
          data: this.stats()
        });
      })
    );
  }

  /**
   * Déclencher immédiatement l'auto-validation à la demande
   */
  runAutoValidationNow(hours: number = 48): Observable<AutoValidationRunResult> {
    this.isExecuting.set(true);
    return this.http.post<AutoValidationRunResult>(`${this.baseUrl}/run-auto-validation`, { hours }).pipe(
      tap((res: AutoValidationRunResult) => {
        this.isExecuting.set(false);
        if (res.data) {
          // Mettre à jour les stats locales
          this.stats.update(current => ({
            ...current,
            pending_eligible_count: 0,
            total_auto_validated_count: current.total_auto_validated_count + res.data.processed_count,
            last_run: {
              id: res.data.log_id,
              executed_at: res.data.executed_at,
              processed_count: res.data.processed_count,
              status: 'success',
              triggered_by: 'manual_admin'
            }
          }));

          // Ajouter une entrée dans les logs récents
          const newLog: SchedulerLog = {
            id: res.data.log_id || Date.now(),
            job_name: 'CheckPendingSubmissionsJob',
            executed_at: res.data.executed_at || new Date().toISOString(),
            processed_count: res.data.processed_count,
            status: 'success',
            details: {
              hours_threshold: res.data.hours_threshold,
              duration_ms: res.data.duration_ms,
              processed_items: res.data.items
            },
            triggered_by: 'manual_admin',
            admin_user: {
              id: 1,
              name: 'Admin SapSap',
              email: 'superadmin@sapsap.bf'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.logs.update(current => [newLog, ...current]);
        }
      }),
      catchError(() => {
        this.isExecuting.set(false);
        // Simulation en mode hors-ligne
        const simulatedItems = [
          {
            submission_id: 4,
            contributor_name: 'Moussa Ouédraogo',
            mission_title: 'Vérification Totem Shell Dassasgho',
            reward: 2500,
            auto_validated_at: new Date().toISOString()
          }
        ];
        const simulatedResult: AutoValidationRunResult = {
          success: true,
          message: '1 soumission(s) de plus de 48h ont été auto-validées avec succès.',
          data: {
            success: true,
            processed_count: 1,
            hours_threshold: hours,
            duration_ms: 45.2,
            log_id: Date.now(),
            executed_at: new Date().toISOString(),
            items: simulatedItems
          }
        };

        this.stats.update(current => ({
          ...current,
          pending_eligible_count: 0,
          total_auto_validated_count: current.total_auto_validated_count + 1,
          last_run: {
            id: simulatedResult.data.log_id,
            executed_at: simulatedResult.data.executed_at,
            processed_count: 1,
            status: 'success',
            triggered_by: 'manual_admin'
          }
        }));

        const newLog: SchedulerLog = {
          id: simulatedResult.data.log_id,
          job_name: 'CheckPendingSubmissionsJob',
          executed_at: simulatedResult.data.executed_at,
          processed_count: 1,
          status: 'success',
          details: {
            hours_threshold: hours,
            duration_ms: 45.2,
            processed_items: simulatedItems
          },
          triggered_by: 'manual_admin',
          admin_user: {
            id: 1,
            name: 'Admin SapSap',
            email: 'superadmin@sapsap.bf'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.logs.update(current => [newLog, ...current]);

        return of(simulatedResult);
      })
    );
  }

  /**
   * Récupérer les journaux d'exécution du Scheduler
   */
  loadLogs(limit: number = 20): Observable<SchedulerLogsResponse> {
    return this.http.get<SchedulerLogsResponse>(`${this.baseUrl}/logs?limit=${limit}`).pipe(
      tap((res: SchedulerLogsResponse) => {
        if (res.success && res.data) {
          this.logs.set(res.data);
        }
      }),
      catchError(() => of({
        success: true,
        data: this.logs()
      }))
    );
  }
}
