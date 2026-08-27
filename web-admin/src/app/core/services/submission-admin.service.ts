import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Submission, SubmissionCounts, SubmissionListResponse, SubmissionDetailResponse } from '../models/submission.model';
import { AdminStatsService } from './admin-stats.service';

@Injectable({
  providedIn: 'root'
})
export class SubmissionAdminService {
  private readonly http = inject(HttpClient);
  private readonly adminStatsService = inject(AdminStatsService);

  private readonly API_URL = 'http://localhost:8080/api/v1/admin/submissions';

  readonly submissions = signal<Submission[]>([]);
  readonly counts = signal<SubmissionCounts>({ total: 0, submitted: 0, validated: 0, rejected: 0, fraud_suspect: 0 });
  readonly isLoading = signal<boolean>(false);
  readonly selectedSubmission = signal<Submission | null>(null);

  /**
   * Charger les soumissions depuis l'API avec filtre optionnel
   */
  loadSubmissions(status: string = 'all'): Observable<SubmissionListResponse> {
    this.isLoading.set(true);
    const url = status === 'all' ? this.API_URL : `${this.API_URL}?status=${status}`;

    return this.http.get<SubmissionListResponse>(url).pipe(
      tap((response: SubmissionListResponse) => {
        this.isLoading.set(false);
        if (response.success) {
          this.submissions.set(response.data);
          this.counts.set(response.counts);

          // Synchroniser le badge du header et de la sidebar
          this.adminStatsService.updateStats({
            pendingSubmissions: response.counts.submitted
          });
        }
      }),
      catchError((error: any) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Valider une soumission et créditer le contributeur
   */
  validateSubmission(id: number): Observable<SubmissionDetailResponse> {
    return this.http.post<SubmissionDetailResponse>(`${this.API_URL}/${id}/validate`, {}).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.loadSubmissions().subscribe();
        }
      })
    );
  }

  /**
   * Rejeter une soumission avec un motif obligatoire
   */
  rejectSubmission(id: number, reason: string): Observable<SubmissionDetailResponse> {
    return this.http.post<SubmissionDetailResponse>(`${this.API_URL}/${id}/reject`, { reason }).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.loadSubmissions().subscribe();
        }
      })
    );
  }

  /**
   * Obtenir les détails d'une soumission
   */
  getSubmissionDetails(id: number): Observable<SubmissionDetailResponse> {
    return this.http.get<SubmissionDetailResponse>(`${this.API_URL}/${id}`).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.selectedSubmission.set(response.data);
        }
      })
    );
  }
}
